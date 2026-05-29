-- Verify Permissions Seeding
-- Run this script to check if all permissions were created successfully

-- 1. Count total permissions
SELECT 'Total Permissions' as metric, COUNT(*) as count FROM permissions;

-- 2. Count permissions by module
SELECT 
    module,
    COUNT(*) as permission_count
FROM permissions
GROUP BY module
ORDER BY permission_count DESC, module;

-- 3. View all permissions
SELECT 
    id,
    slug,
    description,
    module,
    created_at
FROM permissions
ORDER BY module, slug;

-- 4. Check role-permission assignments
SELECT 
    r.name as role_name,
    COUNT(rp.permission_id) as permissions_assigned
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.name
ORDER BY permissions_assigned DESC;

-- 5. View Admin role permissions
SELECT 
    p.module,
    p.slug,
    p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'Admin'
ORDER BY p.module, p.slug;

-- 6. View Manager role permissions
SELECT 
    p.module,
    p.slug,
    p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'Manager'
ORDER BY p.module, p.slug;

-- 7. View IT Staff role permissions
SELECT 
    p.module,
    p.slug,
    p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'IT Staff'
ORDER BY p.module, p.slug;

-- 8. View Employee role permissions
SELECT 
    p.module,
    p.slug,
    p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'Employee'
ORDER BY p.module, p.slug;

-- 9. Find permissions not assigned to any role
SELECT 
    p.slug,
    p.module,
    p.description
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.permission_id IS NULL
ORDER BY p.module, p.slug;

-- 10. Check for duplicate permission slugs (should return 0 rows)
SELECT 
    slug,
    COUNT(*) as duplicate_count
FROM permissions
GROUP BY slug
HAVING COUNT(*) > 1;
