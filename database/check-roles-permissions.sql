-- Check roles
SELECT 'ROLES:' as info;
SELECT id, name, description FROM roles ORDER BY id;

-- Check permissions count
SELECT 'PERMISSIONS COUNT:' as info;
SELECT COUNT(*) as total_permissions FROM permissions;

-- Check users and their roles
SELECT 'USERS AND ROLES:' as info;
SELECT u.id, u.email, u.first_name, u.last_name, r.name as role_name 
FROM users u 
LEFT JOIN roles r ON u.role_id = r.id 
ORDER BY u.id;

-- Check role-permission assignments
SELECT 'ROLE-PERMISSION ASSIGNMENTS:' as info;
SELECT COUNT(*) as total_assignments FROM role_permissions;

-- Check specific role permissions
SELECT 'ADMIN ROLE PERMISSIONS:' as info;
SELECT r.name as role, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.name = 'Admin'
GROUP BY r.name;
