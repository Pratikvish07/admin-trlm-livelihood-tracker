# Implementation Plan - Admin User Management System

## TODO List

### Step 1: Update authSlice.js
- [x] Add hardcoded State Admin 01 (Approval Only): pm.mis2.trlm@gmail.com / StateAdmin@Tripura01
- [x] Add hardcoded State Admin 02 (Super Admin): ceotrlm@gmail.com / StateAdmin@Tripura02
- [x] Add new roles: STATE_ADMIN_APPROVAL, STATE_ADMIN_SUPER
- [x] Add pending registrations storage
- [x] Add approval/rejection actions

### Step 2: Update api.js
- [x] Add signup API function
- [x] Add approval/rejection API functions

### Step 3: Create SignUpPage.jsx
- [x] Registration form for District Admin and Block Admin
- [x] Form fields matching the requirements

### Step 4: Create AdminApprovalPage.jsx
- [x] For State Admins to view pending registrations
- [x] Approve/Reject functionality

### Step 5: Update LoginPage.jsx
- [x] Add link to Sign-Up page
- [x] Update role options
- [x] Add State Admin credentials display

### Step 6: Update routes/index.jsx
- [x] Add signup route
- [x] Add approval route

### Step 7: Update AdminLayout.jsx
- [x] Add Admin Approval menu item with permission filtering

## Status: Completed ✅

