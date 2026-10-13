import glob
import os
import re

def main():
    print("=== Scanning Entire Codebase for Contact References ===")
    html_files = glob.glob("**/*.html", recursive=True)
    js_files = glob.glob("**/*.js", recursive=True)
    css_files = glob.glob("**/*.css", recursive=True)

    all_files = html_files + js_files + css_files
    print(f"Total frontend files checked: {len(all_files)}")

    violations = []
    for file_path in all_files:
        if "node_modules" in file_path or ".git" in file_path:
            continue
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception:
            continue

        # Look for contact navigation, contact page references, contact forms
        nav_matches = re.findall(r'(?i)href=["\'][^"\']*contact[^"\']*["\']', content)
        if nav_matches:
            violations.append((file_path, "Link/Href Match", nav_matches))

        id_matches = re.findall(r'(?i)id=["\']contact[^"\']*["\']', content)
        if id_matches:
            violations.append((file_path, "ID Match", id_matches))

        form_matches = re.findall(r'(?i)<form[^>]*contact[^>]*>', content)
        if form_matches:
            violations.append((file_path, "Form Match", form_matches))

        page_matches = re.findall(r'(?i)["\']contact\.html["\']', content)
        if page_matches:
            # exclude test script checking absence
            if "test_" not in file_path and "verify_" not in file_path:
                violations.append((file_path, "contact.html reference", page_matches))

    if violations:
        print(f"Found {len(violations)} contact reference violations:")
        for v in violations:
            print(f"  [{v[0]}] {v[1]}: {v[2]}")
    else:
        print("SUCCESS: Zero Contact buttons, navigation links, forms, IDs, or pages found in any HTML, JS, or CSS file!")

    # Check if contact.html exists on disk
    contact_page_exists = os.path.exists("contact.html")
    print(f"contact.html exists on disk: {contact_page_exists}")
    assert not contact_page_exists, "contact.html should not exist!"

if __name__ == "__main__":
    main()
