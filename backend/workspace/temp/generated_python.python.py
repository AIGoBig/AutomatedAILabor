# /home/user/connectivity_checker.py
import requests
import sys
from requests.exceptions import ConnectionError, Timeout, TooManyRedirects, RequestException

def verify_connectivity(url, timeout=10):
    """
    Verifies the connectivity of a given URL and returns status details.
    
    Args:
        url (str): The target URL to check.
        timeout (int): Seconds to wait for the server to send data.
        
    Returns:
        dict: A dictionary containing success status, status code, and a descriptive message.
    """
    # Ensure the URL has a scheme
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
        print(f"[Info] Protocol missing. Defaulting to: {url}")

    result = {
        "url": url,
        "reachable": False,
        "status_code": None,
        "message": ""
    }

    try:
        # We use a GET request to ensure the full path is reachable.
        # stream=True is used to avoid downloading large bodies if we only care about the status.
        response = requests.get(url, timeout=timeout, allow_redirects=True, stream=True)
        
        result["status_code"] = response.status_code
        
        # Check if status code is in the 2xx range
        if 200 <= response.status_code < 300:
            result["reachable"] = True
            result["message"] = f"Success: Host is reachable and returned status {response.status_code}."
        else:
            result["reachable"] = False
            result["message"] = f"Warning: Host responded but returned an error status {response.status_code}."
            
    except ConnectionError:
        result["message"] = "Error: Failed to connect to the server. Check the URL or your internet connection (DNS/Connection Refused)."
    except Timeout:
        result["message"] = f"Error: The request timed out after {timeout} seconds."
    except TooManyRedirects:
        result["message"] = "Error: The URL resulted in too many redirects."
    except RequestException as e:
        result["message"] = f"Error: An unexpected error occurred: {e}"
    except Exception as e:
        result["message"] = f"Error: Critical failure: {e}"

    return result

def main():
    print("=== Web Connectivity Validator ===")
    
    # Support command line argument or interactive input
    if len(sys.argv) > 1:
        target_url = sys.argv[1]
    else:
        target_url = input("Enter the URL to check (e.g., google.com): ").strip()

    if not target_url:
        print("Error: No URL provided.")
        return

    print(f"Checking: {target_url}...")
    report = verify_connectivity(target_url)

    # Output formatting
    print("\n" + "="*40)
    print(f"Target URL:  {report['url']}")
    print(f"Status:      {'✅ REACHABLE' if report['reachable'] else '❌ UNREACHABLE'}")
    if report['status_code']:
        print(f"HTTP Code:   {report['status_code']}")
    print(f"Details:     {report['message']}")
    print("="*40 + "\n")

if __name__ == "__main__":
    main()