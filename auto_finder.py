import requests
from bs4 import BeautifulSoup
import base64
from datetime import datetime, timedelta
import time
import re

# Try to import zstandard, fallback if not available
try:
    import zstandard as zstd
    ZSTD_AVAILABLE = True
except ImportError:
    ZSTD_AVAILABLE = False
    print("WARNING: zstandard package not available. Install with: pip install zstandard")

class BarbershopChecker:
    def __init__(self, user_id=None, code_auth=None):
        self.base_url = "https://mytor.co.il/home.php"
        self.base_params = {
            'i': 'cmFtZWwzMw==',  # ramel33
            's': 'MjY1',         # 265
            'mm': 'y',
            'lang': 'he'
        }
        self.session = requests.Session()
        
        # Add headers to mimic the exact browser request
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'he,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Cache-Control': 'max-age=0',
            'Sec-Ch-Ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
        })
        
        # Set authentication cookies if provided
        if user_id and code_auth:
            self.session.cookies.set('userID', user_id)
            self.session.cookies.set('codeAuth', code_auth)
            print(f"Set authentication cookies: userID={user_id}, codeAuth={code_auth}")
        else:
            print("WARNING: No authentication cookies provided. You may need to provide userID and codeAuth cookies.")

    def test_specific_date(self, date_str):
        """
        Test a specific date for debugging purposes
        date_str should be in format: YYYY-MM-DD (e.g., "2025-07-15")
        """
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            return self.check_appointments_for_date(date_obj)
        except ValueError as e:
            return {
                'date': date_str,
                'available': None,
                'message': f'Invalid date format: {str(e)}',
                'times': []
            }

    def format_date_for_url(self, date_obj):
        """Convert datetime object to the format expected by the website"""
        return date_obj.strftime("%Y-%m-%d")

    def check_appointments_for_date(self, date_obj):
        """
        Check if appointments are available for a specific date
        Returns: dict with status and available times (if any)
        """
        try:
            # Format date for the URL (YYYY-MM-DD format)
            date_str = self.format_date_for_url(date_obj)
            
            # Prepare URL parameters - using 'datef' instead of 'd'
            params = self.base_params.copy()
            params['datef'] = date_str
            # Remove problematic signup parameter for now
            # params['signup'] = 'הצג'
            
            print(f"Checking date: {date_obj.strftime('%Y-%m-%d')}", end=" ... ")
            
            # Make the request
            response = self.session.get(self.base_url, params=params, timeout=10, allow_redirects=True)
            response.raise_for_status()
            
            # Handle ZSTD compression manually if needed
            content_encoding = response.headers.get('content-encoding', '').lower()
            if content_encoding == 'zstd' and ZSTD_AVAILABLE:
                print("DEBUG: Manually decompressing ZSTD content...")
                try:
                    decompressor = zstd.ZstdDecompressor()
                    decompressed_content = decompressor.decompress(response.content)
                    response._content = decompressed_content
                    # Remove the content-encoding header so requests doesn't try to decompress again
                    if 'content-encoding' in response.headers:
                        del response.headers['content-encoding']
                    print(f"DEBUG: Successfully decompressed from {len(response.content)} to {len(decompressed_content)} bytes")
                except Exception as e:
                    print(f"DEBUG: ZSTD decompression failed: {e}")
                    print("DEBUG: Trying without manual decompression...")
            elif content_encoding == 'zstd' and not ZSTD_AVAILABLE:
                print("DEBUG: Content is ZSTD compressed but zstandard package not available")
                print("DEBUG: Install with: pip install zstandard")
            
            # Parse the HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Check for "no appointments" message - look for the specific Hebrew text
            no_appointments_messages = [
                'מצטערים, לא נשארו תורים פנויים ליום זה',
                'לא נשארו תורים פנויים'
            ]
            
            # Check in h4 tags with tx-danger class
            danger_elements = soup.find_all('h4', class_='tx-danger')
            for element in danger_elements:
                element_text = element.get_text().strip()
                for msg in no_appointments_messages:
                    if msg in element_text:
                        return {
                            'date': date_obj.strftime('%Y-%m-%d'),
                            'available': False,
                            'message': 'No appointments available',
                            'times': []
                        }
            
            # Look for appointment time buttons
            time_buttons = soup.find_all('button', class_='btn btn-outline-dark btn-block')
            available_times = []
            
            for button in time_buttons:
                # Extract time from button text
                time_text = button.get_text().strip()
                if re.match(r'^\d{1,2}:\d{2}$', time_text):  # Format like "10:00"
                    available_times.append(time_text)
            
            if available_times:
                return {
                    'date': date_obj.strftime('%Y-%m-%d'),
                    'available': True,
                    'message': f'Found {len(available_times)} available appointments',
                    'times': available_times
                }
            else:
                # If no buttons found and no "no appointments" message, check page content for debugging
                print(f"DEBUG: No time buttons found for {date_str}")
                print(f"DEBUG: Page title: {soup.find('title').get_text() if soup.find('title') else 'No title'}")
                
                # Check if there are any buttons at all
                all_buttons = soup.find_all('button')
                print(f"DEBUG: Found {len(all_buttons)} total buttons on page")
                
                return {
                    'date': date_obj.strftime('%Y-%m-%d'),
                    'available': None,
                    'message': 'Could not determine availability - no time buttons found',
                    'times': []
                }
                
        except requests.exceptions.RequestException as e:
            return {
                'date': date_obj.strftime('%Y-%m-%d'),
                'available': None,
                'message': f'Network error: {str(e)}',
                'times': []
            }
        except Exception as e:
            return {
                'date': date_obj.strftime('%Y-%m-%d'),
                'available': None,
                'message': f'Error: {str(e)}',
                'times': []
            }

    def check_multiple_dates(self, start_date, num_days=7, delay=1):
        """
        Check appointments for multiple consecutive dates
        """
        results = []
        current_date = start_date
        
        for i in range(num_days):
            result = self.check_appointments_for_date(current_date)
            results.append(result)
            
            print(f"Date: {result['date']} - Available: {result['available']} - {result['message']}")
            if result['available']:
                print(f"  Times: {', '.join(result['times'])}")
            
            current_date += timedelta(days=1)
            
            # Add delay between requests to be respectful
            if i < num_days - 1:  # Don't delay after the last request
                time.sleep(delay)
        
        return results

    def find_next_available_appointment(self, start_date=None, max_days=30):
        """
        Find the next available appointment starting from start_date
        """
        if start_date is None:
            start_date = datetime.now()
        
        for i in range(max_days):
            check_date = start_date + timedelta(days=i)
            result = self.check_appointments_for_date(check_date)
            
            if result['available']:
                return result
            
            time.sleep(1)  # Be respectful with requests
        
        return None

# Example usage
if __name__ == "__main__":
    # IMPORTANT: Add your authentication cookies here
    # You can find these in your browser's Developer Tools > Application > Cookies
    # Or from the Network tab request headers as shown above
    USER_ID = "4481"  # Replace with your actual userID cookie value
    CODE_AUTH = "Sa1W2GjL"  # Replace with your actual codeAuth cookie value
    
    # Create checker with authentication
    checker = BarbershopChecker(user_id=USER_ID, code_auth=CODE_AUTH)
    
    # Test the specific working URL first
    print("=== Testing known working date: 2025-07-09 ===")
    
    # Test the exact URL that we know works
    test_url = "https://mytor.co.il/home.php?i=cmFtZWwzMw==&s=MjY1&mm=y&lang=he&datef=2025-07-09"
    
    try:
        response = checker.session.get(test_url, timeout=10)
        print(f"Status: {response.status_code}")
        
        # Handle ZSTD compression manually if needed
        content_encoding = response.headers.get('content-encoding', '').lower()
        if content_encoding == 'zstd' and ZSTD_AVAILABLE:
            print("DEBUG: Manually decompressing ZSTD content...")
            try:
                decompressor = zstd.ZstdDecompressor()
                decompressed_content = decompressor.decompress(response.content)
                response._content = decompressed_content
                print(f"DEBUG: Successfully decompressed from {len(response.content)} bytes to {len(decompressed_content)} bytes")
            except Exception as e:
                print(f"DEBUG: ZSTD decompression failed: {e}")
        elif content_encoding == 'zstd' and not ZSTD_AVAILABLE:
            print("DEBUG: Content is ZSTD compressed but zstandard package not available")
            print("DEBUG: Install with: pip install zstandard")
        
        print(f"Content length: {len(response.text)} characters")
        
        # Parse with BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for time buttons
        time_buttons = soup.find_all('button', class_='btn btn-outline-dark btn-block')
        print(f"Found {len(time_buttons)} time buttons")
        
        if time_buttons:
            print("Available times found:")
            for button in time_buttons:
                time_text = button.get_text().strip()
                print(f"  - {time_text}")
        
        # Also check for the date display
        date_elements = soup.find_all('li', class_='breadcrumb-item active')
        for element in date_elements:
            text = element.get_text().strip()
            if 'תאריך:' in text:
                print(f"Found date element: {text}")
        
        # Check for "no appointments" message
        danger_elements = soup.find_all('h4', class_='tx-danger')
        if danger_elements:
            for element in danger_elements:
                print(f"Warning message found: {element.get_text().strip()}")
        
    except Exception as e:
        print(f"Error testing URL: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Now test with our function
    print("Testing with our function:")
    test_result = checker.test_specific_date("2025-07-09")
    print(f"Result: {test_result['message']}")
    if test_result['available']:
        print(f"Available times: {', '.join(test_result['times'])}")
    elif test_result['available'] is False:
        print("No appointments available")
    else:
        print("Could not determine availability")
    
    print("\n" + "="*50 + "\n")
    
    # Check next 30 days
    print("🔍 Checking next 30 days for available appointments...")
    results = checker.check_multiple_dates(datetime.now(), num_days=30, delay=1)
    
    # Show summary
    available_dates = [r for r in results if r['available']]
    if available_dates:
        print(f"\n🎉 Found appointments on {len(available_dates)} dates:")
        for date_result in available_dates:
            print(f"  📅 {date_result['date']}: {len(date_result['times'])} slots - {', '.join(date_result['times'])}")
        
        # Show the earliest available date
        earliest = available_dates[0]
        print(f"\n⏰ Earliest available: {earliest['date']} at {earliest['times'][0]}")
    else:
        print("\n❌ No appointments found in the next 30 days")