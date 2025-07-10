# E2E Test Script: Onboarding Flow

## Test Overview
This script tests the complete user onboarding flow from sign-up to dashboard access, including role-based routing and profile creation.

## Prerequisites
- Application running on localhost:3000
- Clean database state (or ability to create new test users)
- Clerk authentication configured

## Test Scenarios

### Scenario 1: New Athlete Onboarding
**Objective**: Test complete onboarding flow for a new athlete user

**Steps**:
1. **Navigate to Application**
   - Open browser and navigate to `http://localhost:3000`
   - Take screenshot: `01_homepage.png`
   - Verify homepage loads correctly

2. **Sign Up Process**
   - Click "Sign Up" button
   - Fill in registration form with test data:
     - Email: `test-athlete-${timestamp}@example.com`
     - Password: `TestPassword123!`
     - First Name: `Test`
     - Last Name: `Athlete`
   - Submit form
   - Take screenshot: `02_signup_form.png`
   - Verify user is redirected to onboarding page

3. **Onboarding Step 1: Personal Information**
   - Verify onboarding wizard displays
   - Check that form fields are pre-populated from sign-up
   - Update username if needed
   - Select timezone
   - Take screenshot: `03_onboarding_step1.png`
   - Click "Next" to proceed

4. **Onboarding Step 2: Role Selection**
   - Verify role selection options are displayed
   - Select "Athlete" role
   - Take screenshot: `04_role_selection.png`
   - Click "Next" to proceed

5. **Onboarding Step 3: Athlete-Specific Information**
   - Verify athlete-specific form is displayed
   - Fill in athlete data:
     - Training Goals: `Complete my first marathon`
     - Experience Level: `Beginner`
     - Events: Select `5K` and `10K`
     - Height: `170` cm (optional)
     - Weight: `70` kg (optional)
   - Take screenshot: `05_athlete_details.png`
   - Click "Complete Onboarding"

6. **Onboarding Completion**
   - Verify loading state is shown
   - Wait for redirect to dashboard
   - Take screenshot: `06_dashboard_redirect.png`
   - Verify user lands on athlete dashboard
   - Check that onboarding is marked as complete

7. **Dashboard Verification**
   - Verify athlete-specific dashboard elements are present
   - Check navigation menu includes athlete-specific options
   - Take screenshot: `07_athlete_dashboard.png`
   - Verify user profile shows correct role and information

### Scenario 2: New Coach Onboarding
**Objective**: Test complete onboarding flow for a new coach user

**Steps**:
1. **Navigate and Sign Up**
   - Open new browser session
   - Navigate to `http://localhost:3000`
   - Sign up with coach credentials:
     - Email: `test-coach-${timestamp}@example.com`
     - Password: `TestPassword123!`
     - First Name: `Test`
     - Last Name: `Coach`

2. **Coach Onboarding Flow**
   - Complete personal information step
   - Select "Coach" role
   - Take screenshot: `08_coach_role_selection.png`
   - Fill in coach-specific information:
     - Specialty: `Distance Running`
     - Experience: `5 years`
     - Philosophy: `Consistent training leads to success`
     - Sport Focus: `Marathon Training`
   - Take screenshot: `09_coach_details.png`
   - Complete onboarding

3. **Coach Dashboard Verification**
   - Verify redirect to coach dashboard
   - Check coach-specific navigation and features
   - Take screenshot: `10_coach_dashboard.png`

### Scenario 3: Onboarding Validation Testing
**Objective**: Test form validation and error handling

**Steps**:
1. **Invalid Data Testing**
   - Start onboarding with incomplete data
   - Test required field validation
   - Test email format validation
   - Take screenshot: `11_validation_errors.png`

2. **Network Error Simulation**
   - Simulate network failure during onboarding submission
   - Verify error handling and user feedback
   - Take screenshot: `12_network_error.png`

### Scenario 4: Authentication Flow Testing
**Objective**: Test authentication integration and route protection

**Steps**:
1. **Unauthenticated Access**
   - Try to access protected routes without authentication
   - Verify redirect to sign-in page
   - Take screenshot: `13_auth_redirect.png`

2. **Incomplete Onboarding**
   - Sign in with user who hasn't completed onboarding
   - Verify redirect to onboarding page
   - Take screenshot: `14_onboarding_redirect.png`

### Scenario 5: Responsive Design Testing
**Objective**: Test onboarding flow on different screen sizes

**Steps**:
1. **Mobile Viewport (375x667)**
   - Set viewport to mobile size
   - Complete onboarding flow
   - Take screenshots at each step with `_mobile` suffix
   - Verify mobile-specific UI elements

2. **Tablet Viewport (768x1024)**
   - Set viewport to tablet size
   - Test onboarding flow
   - Take screenshots with `_tablet` suffix

3. **Desktop Viewport (1920x1080)**
   - Set viewport to desktop size
   - Complete full onboarding flow
   - Take screenshots with `_desktop` suffix

## Expected Results

### Success Criteria
- [ ] All form validations work correctly
- [ ] Role-based routing functions properly
- [ ] Database records are created correctly
- [ ] User sessions are maintained throughout the flow
- [ ] Responsive design works on all tested viewports
- [ ] Error handling provides clear user feedback
- [ ] Navigation between steps is smooth and intuitive

### Performance Criteria
- [ ] Onboarding pages load within 2 seconds
- [ ] Form submissions complete within 3 seconds
- [ ] No console errors during the flow
- [ ] No memory leaks or performance issues

## Test Data Cleanup
After test completion:
1. Clean up test user accounts from Clerk
2. Remove test data from database
3. Clear any uploaded test files

## Failure Scenarios to Test
1. **Network Connectivity Issues**
   - Intermittent connection during onboarding
   - Complete network failure during submission

2. **Browser Compatibility**
   - Test on Chrome, Firefox, Safari, Edge
   - Test with JavaScript disabled

3. **Session Management**
   - Test session timeout during onboarding
   - Test multiple browser tabs/windows

4. **Data Validation Edge Cases**
   - Special characters in form fields
   - Extremely long input values
   - SQL injection attempts

## Screenshot Organization
All screenshots should be saved with descriptive names and organized by scenario:
```
screenshots/
├── scenario1_athlete/
│   ├── 01_homepage.png
│   ├── 02_signup_form.png
│   └── ...
├── scenario2_coach/
│   ├── 08_coach_role_selection.png
│   └── ...
└── responsive/
    ├── mobile/
    ├── tablet/
    └── desktop/
```

## Reporting
Document all findings in a test report including:
- Test execution summary
- Screenshots of key steps
- Any bugs or issues discovered
- Performance metrics
- Recommendations for improvement 