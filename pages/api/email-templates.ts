import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = supabaseAdmin;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Admin authentication
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'PUT':
      return handlePut(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { templateName, includeInactive } = req.query;

    let query = supabase
      .from('email_templates')
      .select('*')
      .order('template_name', { ascending: true })
      .order('version', { ascending: false });

    if (templateName) {
      query = query.eq('template_name', templateName);
    }

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      templates: data || []
    });

  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return res.status(500).json({
      error: 'Failed to fetch templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      templateName,
      subjectTemplate,
      htmlTemplate,
      textTemplate,
      variables,
      notes,
      makeActive
    } = req.body;

    // Validate required fields
    if (!templateName || !subjectTemplate || !htmlTemplate) {
      return res.status(400).json({
        error: 'Missing required fields: templateName, subjectTemplate, htmlTemplate'
      });
    }

    // Get the latest version for this template
    const { data: latestVersion } = await supabase
      .from('email_templates')
      .select('version')
      .eq('template_name', templateName)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const newVersion = (latestVersion?.version || 0) + 1;

    // If makeActive is true, deactivate other versions
    if (makeActive) {
      await supabase
        .from('email_templates')
        .update({ is_active: false })
        .eq('template_name', templateName);
    }

    // Create new template version
    const { data: newTemplate, error } = await supabase
      .from('email_templates')
      .insert({
        template_name: templateName,
        version: newVersion,
        subject_template: subjectTemplate,
        html_template: htmlTemplate,
        text_template: textTemplate,
        variables: variables || {},
        is_active: makeActive || false,
        created_by: 'admin', // Could be enhanced with actual user info
        notes: notes || `Version ${newVersion} created`
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      template: newTemplate,
      message: `Template version ${newVersion} created successfully`
    });

  } catch (error) {
    console.error('Failed to create template:', error);
    return res.status(500).json({
      error: 'Failed to create template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, action, templateName } = req.body;

    if (action === 'activate') {
      if (!id) {
        return res.status(400).json({ error: 'Template ID required' });
      }

      // Get template info
      const { data: template } = await supabase
        .from('email_templates')
        .select('template_name')
        .eq('id', id)
        .single();

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Deactivate all versions of this template
      await supabase
        .from('email_templates')
        .update({ is_active: false })
        .eq('template_name', template.template_name);

      // Activate the specified version
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Template version activated'
      });

    } else if (action === 'clone') {
      if (!id) {
        return res.status(400).json({ error: 'Template ID required' });
      }

      // Get existing template
      const { data: existingTemplate } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (!existingTemplate) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Get next version number
      const { data: latestVersion } = await supabase
        .from('email_templates')
        .select('version')
        .eq('template_name', existingTemplate.template_name)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      const newVersion = (latestVersion?.version || 0) + 1;

      // Create cloned version
      const { data: clonedTemplate, error } = await supabase
        .from('email_templates')
        .insert({
          template_name: existingTemplate.template_name,
          version: newVersion,
          subject_template: existingTemplate.subject_template,
          html_template: existingTemplate.html_template,
          text_template: existingTemplate.text_template,
          variables: existingTemplate.variables,
          is_active: false,
          created_by: 'admin',
          notes: `Cloned from version ${existingTemplate.version}`
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        template: clonedTemplate,
        message: `Template cloned as version ${newVersion}`
      });

    } else if (action === 'rollback') {
      if (!templateName) {
        return res.status(400).json({ error: 'Template name required' });
      }

      // Get previous active version
      const { data: versions } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_name', templateName)
        .order('version', { ascending: false })
        .limit(2);

      if (!versions || versions.length < 2) {
        return res.status(400).json({ error: 'No previous version to rollback to' });
      }

      const previousVersion = versions[1];

      // Deactivate current and activate previous
      await supabase
        .from('email_templates')
        .update({ is_active: false })
        .eq('template_name', templateName);

      await supabase
        .from('email_templates')
        .update({ is_active: true })
        .eq('id', previousVersion.id);

      return res.status(200).json({
        success: true,
        message: `Rolled back to version ${previousVersion.version}`,
        template: previousVersion
      });

    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Failed to update template:', error);
    return res.status(500).json({
      error: 'Failed to update template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 