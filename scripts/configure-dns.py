#!/usr/bin/env python3
"""
Configure DNS records for reesereviews.com via Namecheap API.
Points the domain to DigitalOcean App Platform.

IMPORTANT: This script must be run from a machine whose public IP
is whitelisted in the Namecheap API settings.
Whitelisted IP: 143.14.254.217

Usage:
  python3 configure-dns.py [--do-app-url <app>.ondigitalocean.app]

If --do-app-url is not provided, it defaults to the pattern from the DO app spec.
"""

import requests
import xml.etree.ElementTree as ET
import sys
import argparse

API_KEY = "e9c5376947004f228787bddc52a685c3"
USERNAME = "uprisinghope"
CLIENT_IP = "143.14.254.217"
DOMAIN = "reesereviews"
TLD = "com"
BASE_URL = "https://api.namecheap.com/xml.response"

# Default DO App Platform URL - update this after creating the app
DEFAULT_DO_URL = "reese-reviews-frontend-4y7xq.ondigitalocean.app"


def api_call(command, extra_params=None):
    params = {
        "ApiUser": USERNAME,
        "ApiKey": API_KEY,
        "UserName": USERNAME,
        "ClientIp": CLIENT_IP,
        "Command": command,
    }
    if extra_params:
        params.update(extra_params)

    resp = requests.get(BASE_URL, params=params)
    root = ET.fromstring(resp.text)
    status = root.attrib.get("Status", "Unknown")

    if status == "ERROR":
        errors = []
        for err in root.iter():
            if "Error" in err.tag and err.text:
                errors.append(err.text.strip())
        return root, status, errors

    return root, status, []


def get_hosts():
    """Get current DNS host records."""
    root, status, errors = api_call("namecheap.domains.dns.getHosts", {
        "SLD": DOMAIN,
        "TLD": TLD,
    })

    if errors:
        print(f"Error getting hosts: {'; '.join(errors)}")
        return []

    records = []
    for elem in root.iter():
        attribs = elem.attrib
        if attribs.get("Name") and attribs.get("Type"):
            records.append({
                "name": attribs.get("Name"),
                "type": attribs.get("Type"),
                "address": attribs.get("Address"),
                "ttl": attribs.get("TTL"),
            })
            print(f"  {attribs['Name']:20s} {attribs['Type']:8s} {attribs.get('Address', '?')}")

    return records


def set_hosts(do_app_url):
    """Set DNS records pointing to DigitalOcean App Platform."""
    params = {
        "SLD": DOMAIN,
        "TLD": TLD,
        # Root domain -> CNAME to DO App Platform
        "HostName1": "@",
        "RecordType1": "CNAME",
        "Address1": do_app_url,
        "TTL1": "1800",
        # www subdomain -> CNAME to DO App Platform
        "HostName2": "www",
        "RecordType2": "CNAME",
        "Address2": do_app_url,
        "TTL2": "1800",
    }

    root, status, errors = api_call("namecheap.domains.dns.setHosts", params)

    if errors:
        print(f"Error setting hosts: {'; '.join(errors)}")
        # If CNAME at root fails, try with URL redirect for root
        print("Trying alternative: URL Redirect for root, CNAME for www...")
        params_alt = {
            "SLD": DOMAIN,
            "TLD": TLD,
            # Root domain -> URL Redirect to www
            "HostName1": "@",
            "RecordType1": "URL",
            "Address1": f"https://www.reesereviews.com",
            "TTL1": "1800",
            # www subdomain -> CNAME to DO App Platform
            "HostName2": "www",
            "RecordType2": "CNAME",
            "Address2": do_app_url,
            "TTL2": "1800",
        }
        root2, status2, errors2 = api_call("namecheap.domains.dns.setHosts", params_alt)
        if errors2:
            print(f"Alternative also failed: {'; '.join(errors2)}")
            return False
        else:
            print("Alternative succeeded!")
            return True
    else:
        print("DNS records set successfully!")
        return True


def main():
    parser = argparse.ArgumentParser(description="Configure DNS for reesereviews.com")
    parser.add_argument("--do-app-url", default=DEFAULT_DO_URL,
                        help="DigitalOcean App Platform URL (e.g., reese-reviews-xxxxx.ondigitalocean.app)")
    args = parser.parse_args()

    print("=" * 60)
    print("Namecheap DNS Configuration for reesereviews.com")
    print(f"Target: {args.do_app_url}")
    print("=" * 60)

    print("\n--- Current DNS Records ---")
    get_hosts()

    print(f"\n--- Setting DNS to point to {args.do_app_url} ---")
    success = set_hosts(args.do_app_url)

    if success:
        print("\n--- Verifying DNS Records ---")
        get_hosts()
        print("\nDNS configuration complete!")
        print("Allow 15-60 minutes for DNS propagation.")
        print("DigitalOcean will automatically provision SSL once DNS resolves.")
    else:
        print("\nDNS configuration failed. Please set records manually:")
        print(f"  @   -> CNAME -> {args.do_app_url}")
        print(f"  www -> CNAME -> {args.do_app_url}")


if __name__ == "__main__":
    main()
