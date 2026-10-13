import urllib.request
import re

BASE_URL = "http://localhost:8080"

def test_login_page():
    req = urllib.request.Request(f"{BASE_URL}/login.html")
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')

    print("[1] Checking layout elements order in login.html...")
    
    # 1. SlopeGuard logo and "Welcome Back" heading
    logo_brand_pos = html.find('login-brand-header')
    welcome_back_pos = html.find('Welcome Back')
    assert logo_brand_pos != -1, "Logo brand header missing"
    assert welcome_back_pos != -1, "Welcome Back heading missing"
    print("  -> Logo and Welcome Back heading found")

    # 2. Email address input
    email_pos = html.find('id="usernameInput"')
    assert email_pos != -1, "Email input missing"
    assert email_pos > welcome_back_pos, "Email input must appear after Welcome Back"
    print("  -> Email address input found and correctly ordered")

    # 3. Password input with show/hide toggle
    password_pos = html.find('id="passwordInput"')
    toggle_pos = html.find('id="togglePasswordBtn"')
    assert password_pos != -1, "Password input missing"
    assert toggle_pos != -1, "Password toggle button missing"
    assert password_pos > email_pos, "Password input must appear after Email input"
    print("  -> Password input and toggle button found and correctly ordered")

    # 4. Forgot Password link
    forgot_pos = html.find('id="forgotLink"')
    assert forgot_pos != -1, "Forgot password link missing"
    assert forgot_pos > password_pos, "Forgot password link must appear after Password input"
    print("  -> Forgot Password link found and correctly ordered")

    # 5. Primary Log In button
    submit_btn_pos = html.find('id="submitBtn"')
    assert submit_btn_pos != -1, "Submit button missing"
    assert submit_btn_pos > forgot_pos, "Submit button must appear after Forgot Password"
    assert "Log In" in html[submit_btn_pos:submit_btn_pos+200], "Submit button text should be 'Log In'"
    print("  -> Primary Log In button found and correctly ordered")

    # 6. Separator labelled "OR"
    divider_pos = html.find('class="login-divider"')
    assert divider_pos != -1, "Separator OR missing"
    assert divider_pos > submit_btn_pos, "Separator OR must appear after Log In button"
    print("  -> Separator labelled 'OR' found and correctly ordered")

    # 7. Continue with Google button
    google_btn_pos = html.find('id="btnGoogleSignIn"')
    assert google_btn_pos != -1, "Google button missing"
    assert google_btn_pos > divider_pos, "Google button must appear after Separator OR"
    assert "Continue with Google" in html[google_btn_pos:google_btn_pos+300], "Google button text missing"
    print("  -> Continue with Google button found and correctly ordered")

    # 8. Sign Up footer below login details
    signup_footer_pos = html.find('class="login-signup-footer"')
    signup_link_pos = html.find('id="signUpLink"')
    assert signup_footer_pos != -1, "Sign Up footer missing"
    assert signup_link_pos != -1, "Sign Up link missing"
    assert signup_footer_pos > google_btn_pos, "Sign Up footer must appear below login details (after Google button)"
    
    # Check text
    footer_slice = html[signup_footer_pos:signup_footer_pos+300]
    assert "Don't have an account?" in footer_slice, "Footer text missing 'Don\'t have an account?'"
    assert "Sign Up" in footer_slice, "Footer text missing 'Sign Up'"
    assert 'href="signup.html' in footer_slice, "Sign Up link must point to signup.html"
    print("  -> Sign Up footer found below login details, pointing to signup.html")

    # Check Styling Requirements
    print("\n[2] Checking styling requirements...")
    # Solid lime primary Log In button
    assert ".btn-sign-in" in html or "btn-sign-in" in html
    # Google button light background
    assert "#FFFFFF" in html, "Google button should have white/light background styling"
    assert "#3C4043" in html or "#202124" in html, "Google button should have dark readable text styling"
    # Show/hide toggle icons
    assert 'id="eyeIcon"' in html
    assert 'id="eyeOffIcon"' in html
    print("  -> Styling and icon toggles verified")

    # Check that Contact feature is NOT reintroduced
    print("\n[3] Checking Contact feature removal...")
    assert 'contact.html' not in html, "contact.html must not be present"
    assert 'href="#contact"' not in html, "Contact link must not be present"
    print("  -> No Contact feature reintroduced")

    # Check signup.html exists and is accessible
    print("\n[4] Checking signup.html accessibility...")
    req_signup = urllib.request.Request(f"{BASE_URL}/signup.html")
    with urllib.request.urlopen(req_signup) as resp_signup:
        assert resp_signup.status == 200, "signup.html should return HTTP 200"
        signup_html = resp_signup.read().decode('utf-8')
        assert "Authorized Registration" in signup_html
        assert "login.html" in signup_html
    print("  -> signup.html is accessible and functional")

    # Check forgot-password.html exists and is accessible
    print("\n[5] Checking forgot-password.html accessibility...")
    req_forgot = urllib.request.Request(f"{BASE_URL}/forgot-password.html")
    with urllib.request.urlopen(req_forgot) as resp_forgot:
        assert resp_forgot.status == 200, "forgot-password.html should return HTTP 200"
        forgot_html = resp_forgot.read().decode('utf-8')
        assert "Reset Password" in forgot_html or "Account Recovery" in forgot_html
    print("  -> forgot-password.html is accessible and functional")

    print("\n=== ALL LOGIN PAGE VERIFICATION TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_login_page()
