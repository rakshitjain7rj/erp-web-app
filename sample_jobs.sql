-- Insert sample production jobs for testing
INSERT INTO "ProductionJobs" (
  "jobId",
  "productName",
  "quantity",
  "unit", 
  "machineId",
  "status",
  "priority",
  "startDate",
  "dueDate",
  "estimatedHours",
  "partyName",
  "notes",
  "createdAt",
  "updatedAt"
) VALUES 
('JOB-001', 'Cotton Yarn 20s', 500.00, 'kg', 1, 'pending', 'high', '2024-12-26', '2024-12-28', 8.0, 'ABC Textiles', 'High priority order for ABC Textiles', NOW(), NOW()),
('JOB-002', 'Cotton Yarn 30s', 300.00, 'kg', 2, 'in_progress', 'medium', '2024-12-25', '2024-12-27', 6.0, 'XYZ Mills', 'Standard cotton yarn production', NOW(), NOW()),
('JOB-003', 'Fabric Weaving - Cotton', 200.00, 'meters', 3, 'pending', 'low', '2024-12-27', '2024-12-30', 12.0, 'DEF Garments', 'Cotton fabric for garment production', NOW(), NOW()),
('JOB-004', 'Yarn Dyeing - Blue', 150.00, 'kg', 4, 'completed', 'medium', '2024-12-20', '2024-12-22', 4.0, 'GHI Fashion', 'Blue dye job completed successfully', NOW(), NOW()),
('JOB-005', 'Quality Inspection Batch 1', 100.00, 'units', 5, 'in_progress', 'high', '2024-12-26', '2024-12-26', 2.0, 'ABC Textiles', 'Quality control for ABC order', NOW(), NOW());
