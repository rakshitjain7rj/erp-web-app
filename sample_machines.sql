-- Insert sample machines for testing
INSERT INTO "Machines" (
  "machineId", 
  "machineName", 
  "machineType", 
  "status", 
  "capacity", 
  "capacityUnit", 
  "location", 
  "specifications",
  "createdAt", 
  "updatedAt"
) VALUES 
('M-001', 'Spinning Machine A1', 'Spinning', 'Active', 120.00, 'kg/hour', 'Floor A - Section 1', 'High-speed spinning machine for cotton yarn', NOW(), NOW()),
('M-002', 'Spinning Machine A2', 'Spinning', 'Active', 100.00, 'kg/hour', 'Floor A - Section 2', 'Standard spinning machine for mixed fibers', NOW(), NOW()),
('M-003', 'Weaving Loom B1', 'Weaving', 'Active', 80.00, 'meters/hour', 'Floor B - Section 1', 'Automatic weaving loom for fabric production', NOW(), NOW()),
('M-004', 'Dyeing Machine C1', 'Dyeing', 'Maintenance', 200.00, 'kg/batch', 'Floor C - Section 1', 'High-capacity dyeing machine for yarn coloring', NOW(), NOW()),
('M-005', 'Quality Control Station', 'Quality Control', 'Active', 50.00, 'units/hour', 'Floor D - QC Area', 'Automated quality inspection station', NOW(), NOW());
