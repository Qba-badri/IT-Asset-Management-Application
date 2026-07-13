UPDATE users 
SET password_hash = '$2b$10$/CXIhJgS1WjxGUPkqpX4f.hdHRVzpIxGAVgkOr0jH.wuAUJrsPfi2' 
WHERE email IN (
    'admin@qbadvisory.com', 
    'manager@qbadvisory.com', 
    'user@qbadvisory.com', 
    'john.doe@qbadvisory.com', 
    'sarah.wilson@qbadvisory.com', 
    'mike.johnson@qbadvisory.com', 
    'badri.pradhan@qbadvisory.com',
    'developer@qbadvisory.com'
);
