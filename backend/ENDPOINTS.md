# Lady's Essence — Backend Endpoints

This file lists the backend API endpoints discovered in the repository, grouped by blueprint (route module) and URL prefix as registered in `backend/app/__init__.py`.

Base URL prefix: `/api` (many blueprints are mounted under `/api/...`).

---

## App-level routes (no blueprint)
- GET / -> index (API running)
- GET /health -> health_check (returns status, timestamp)
- GET /api/test-cors -> test_cors (CORS debug endpoint)

---

## /api/auth (Blueprint: `auth_bp` — `app/routes/auth.py`)
- POST /api/auth/register — register (create user)
- POST /api/auth/login — login (password or PIN)
- POST /api/auth/refresh — refresh (refresh access token) [refresh JWT required]
- GET /api/auth/profile — get_profile (JWT required)
- PUT /api/auth/profile — update_profile (JWT required)
- GET /api/auth/test-jwt — test_jwt (JWT required)

---

## /api/cycle-logs (Blueprint: `cycle_logs_bp` — `app/routes/cycle_logs.py`)
- GET /api/cycle-logs/ — get_cycle_logs (list user's cycle logs) [JWT required]
- GET /api/cycle-logs/<log_id> — get_cycle_log (get single log) [JWT required]
- POST /api/cycle-logs/ — create_cycle_log (create log) [JWT required]
- PUT /api/cycle-logs/<log_id> — update_cycle_log (update log) [JWT required]
- DELETE /api/cycle-logs/<log_id> — delete_cycle_log [JWT required]
- GET /api/cycle-logs/stats — get_cycle_stats (aggregated stats) [JWT required]
- GET /api/cycle-logs/calendar — get_calendar_data (calendar view) [JWT required]
- GET /api/cycle-logs/test/calendar — get_test_calendar_data (public test endpoint)

---

## /api/meal-logs (Blueprint: `meal_logs_bp` — `app/routes/meal_logs.py`)
- GET /api/meal-logs/ — get_meal_logs (list meal logs) [JWT required]
- GET /api/meal-logs/<log_id> — get_meal_log [JWT required]
- POST /api/meal-logs/ — create_meal_log [JWT required]
- PUT /api/meal-logs/<log_id> — update_meal_log [JWT required]
- DELETE /api/meal-logs/<log_id> — delete_meal_log [JWT required]
- GET /api/meal-logs/stats — get_meal_stats (nutrition summary) [JWT required]

---

## /api/appointments (Blueprint: `appointments_bp` — `app/routes/appointments.py`)
- POST /api/appointments/test/create — create_test_appointment (public test)
- GET /api/appointments/ — get_appointments (list user's appointments) [JWT required]
- GET /api/appointments/<appointment_id> — get_appointment [JWT required]
- POST /api/appointments/ — create_appointment [JWT required]
- PUT /api/appointments/<appointment_id> — update_appointment [JWT required]
- DELETE /api/appointments/<appointment_id> — delete_appointment [JWT required]
- GET /api/appointments/upcoming — get_upcoming_appointments [JWT required]
- GET /api/appointments/test/upcoming — get_test_upcoming_appointments (public test)

---

## /api/appointments-enhanced (Blueprint: `appointments_enhanced_bp` — `app/routes/appointments_enhanced.py`)
- GET /api/appointments-enhanced/search-providers — search_providers [JWT required]
- GET /api/appointments-enhanced/providers/<provider_id>/detailed-info — get_provider_detailed_info [JWT required]
- POST /api/appointments-enhanced/book-appointment — book_appointment_enhanced [JWT required]
- PUT /api/appointments-enhanced/appointments/<appointment_id>/confirm — confirm_appointment [JWT required]
- ... (this module contains many additional endpoints for slots, waiting lists, availability, provider dashboards and admin-like appointment operations) — see file for full list.

---

## /api/notifications (Blueprint: `notifications_bp` — `app/routes/notifications.py`)
- GET /api/notifications/ — get_notifications (list) [JWT required]
- GET /api/notifications/<notification_id> — get_notification [JWT required]
- PUT /api/notifications/<notification_id>/read — mark_notification_read [JWT required]
- PUT /api/notifications/read-all — mark_all_read [JWT required]
- DELETE /api/notifications/<notification_id> — delete_notification [JWT required]
- GET /api/notifications/unread-count — get_unread_count [JWT required]
- GET /api/notifications/settings — get_notification_settings [JWT required]
- PUT /api/notifications/settings — update_notification_settings [JWT required]
- GET /api/notifications/recent — get_recent_notifications [JWT required]

---

## /api/content (Blueprint: `content_bp` — `app/routes/content.py`)
- GET /api/content/categories — get_categories (public)
- GET /api/content/categories/<category_id> — get_category (public)
- GET /api/content/items — get_content_items (public)
- GET /api/content/items/<item_id> — get_content_item (public)
- GET /api/content/featured — get_featured_content (public)
- GET /api/content/search?q=... — search_content (public)
- POST /api/content/categories — create_category (admin-like, JWT required)
- POST /api/content/items — create_content_item (admin-like, JWT required)

---

## /api/parents (Blueprint: `parents_bp` — `app/routes/parents.py`)
- GET /api/parents/children — get_children [JWT required, parent only]
- GET /api/parents/children/<adolescent_id> — get_child [JWT required, parent only]
- POST /api/parents/children or /api/parents/children/add — add_child [JWT required, parent only]
- PUT /api/parents/children/<adolescent_id> — update_child [JWT required, parent only]
- DELETE /api/parents/children/<adolescent_id> — delete_child [JWT required, parent only]
- GET /api/parents/children/<adolescent_id>/cycle-logs — get_child_cycle_logs [JWT required, parent only]
- POST /api/parents/children/<adolescent_id>/cycle-logs — create_child_cycle_log [JWT required, parent only]

---

## /api/ussd (Blueprint: `ussd_bp` — `app/routes/ussd.py`)
- POST /api/ussd — handle_ussd (main USSD handler)
  - The module contains many helper flows for cycle_tracking, meal_logging, appointments, notifications, education, parent_dashboard, settings, feedback and session handling. See `app/routes/ussd.py` for the full USSD flow.

---

## /api/admin (Blueprint: `admin_bp` — `app/routes/admin.py` and `admin_complete.py`)
- GET /api/admin/dashboard/stats — get_dashboard_stats [admin_required]
- GET /api/admin/users — get_all_users [admin_required]
- GET /api/admin/users/<user_id> — get_user_details [admin_required]
- POST /api/admin/users/create — create_user [admin_required]
- PATCH /api/admin/users/<user_id>/toggle-status — toggle_user_status [admin_required]
- DELETE /api/admin/users/<user_id> — delete_user [admin_required]
- GET /api/admin/users/statistics — get_user_statistics [admin_required]
- POST /api/admin/users/bulk-action — bulk action endpoint (incomplete in snippet) [admin_required]
- ... (many admin endpoints for content management, analytics, logs, role/permission management exist in `admin.py` and `admin_complete.py`)

---

## /api/content-writer (Blueprint: `content_writer_bp` — `app/routes/content_writer.py`)
- (Content writer endpoints: create content drafts, submit for review, view drafts, manage articles) — see file for exact routes. Usually JWT required and role-based.

---

## /api/health-provider (Blueprint: `health_provider_bp` — `app/routes/health_provider.py`)
- (Health provider endpoints: provider profile, availability, appointments management, reviews) — see file for exact routes. JWT required and provider role.

---

## /api (Blueprint: `parent_appointments_bp` — `app/routes/parent_appointments.py`)
- This blueprint is registered with url_prefix `/api` and provides parent-facing appointment endpoints (e.g., schedule on behalf of child). See `parent_appointments.py` for details.

---

## Other notable route modules
- `analytics_enhanced.py` — advanced analytics endpoints (registered under its own blueprint; see file)
- `notifications_enhanced.py` — enhanced notifications endpoints
- `admin_complete.py` — additional admin endpoints
- `meta.py` — small meta endpoints (version, info)

---

Notes and next steps
- This document was generated by scanning route modules and the app factory (`backend/app/__init__.py`).
- For exact request/response payloads, validation rules, and more endpoints (especially in large modules such as `appointments_enhanced.py`, `ussd.py`, `admin.py` and `appointments_enhanced.py`) open the module files in `backend/app/routes` and search for `@<blueprint>.route` decorators.

If you'd like, I can:
- Expand each module's section with full enumerated endpoints (I can extract every @route line and the immediate function docstring).
- Generate an OpenAPI (Swagger) spec stub from these routes.
- Produce a shorter CSV or JSON list of endpoints for tooling.

---

Generated on 2025-11-06 by repository scan.
