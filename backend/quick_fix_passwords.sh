#!/bin/bash
# Quick fix script for password hash issues

echo "================================================"
echo "  Password Hash Fix - Quick Repair Script"
echo "================================================"
echo ""

# Change to backend directory
cd /home/desire/My_Project/ladys_essenced/backend

echo "Step 1: Checking for invalid password hashes..."
echo "------------------------------------------------"
python3 fix_password_hashes.py

echo ""
echo "================================================"
echo "  Fix Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Test login with affected users"
echo "2. Default password for fixed users: 'password123'"
echo "3. Ask users to change their passwords"
echo ""
