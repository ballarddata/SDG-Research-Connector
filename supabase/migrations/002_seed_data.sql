-- Seed SDGs with official UN SDG
INSERT INTO sdgs (id, name, description, color) VALUES
(1, 'No Poverty', 'End poverty in all its forms everywhere', '#E5243B'),
(2, 'Zero Hunger', 'End hunger, achieve food security and improved nutrition', '#DDA63A'),
(3, 'Good Health and Well-being', 'Ensure healthy lives and promote well-being for all', '#4C9F38'),
(4, 'Quality Education', 'Ensure inclusive and equitable quality education', '#C5192D'),
(5, 'Gender Equality', 'Achieve gender equality and empower all women and girls', '#FF3A21'),
(6, 'Clean Water and Sanitation', 'Ensure availability and sustainable management of water', '#26BDE2'),
(7, 'Affordable and Clean Energy', 'Ensure access to affordable, reliable, sustainable energy', '#FCC30B'),
(8, 'Decent Work and Economic Growth', 'Promote sustained, inclusive economic growth', '#A21942'),
(9, 'Industry, Innovation and Infrastructure', 'Build resilient infrastructure, promote innovation', '#FD6925'),
(10, 'Reduced Inequalities', 'Reduce inequality within and among countries', '#DD1367'),
(11, 'Sustainable Cities and Communities', 'Make cities and human settlements inclusive and sustainable', '#FD9D24'),
(12, 'Responsible Consumption and Production', 'Ensure sustainable consumption and production patterns', '#BF8B2E'),
(13, 'Climate Action', 'Take urgent action to combat climate change', '#3F7E44'),
(14, 'Life Below Water', 'Conserve and sustainably use the oceans, seas and marine resources', '#0A97D9'),
(15, 'Life on Land', 'Protect, restore and promote sustainable use of terrestrial ecosystems', '#56C02B'),
(16, 'Peace, Justice and Strong Institutions', 'Promote peaceful and inclusive societies', '#00689D'),
(17, 'Partnerships for the Goals', 'Strengthen the means of implementation', '#19486A');

-- Example institutions
INSERT INTO institutions (id, name, country, type) VALUES
(gen_random_uuid(), 'Brigham Young University', 'USA', 'university'),
(gen_random_uuid(), 'Stanford University', 'USA', 'university'),
(gen_random_uuid(), 'Massachusetts Institute of Technology', 'USA', 'university'),
(gen_random_uuid(), 'University of Oxford', 'UK', 'university'),
(gen_random_uuid(), 'ETH Zurich', 'Switzerland', 'university');

-- Sample authors
INSERT INTO authors (id, name, email, institution_id) VALUES
(gen_random_uuid(), 'Dr. Jane Smith', 'jane.smith@byu.edu', 
  (SELECT id FROM institutions WHERE name = 'Brigham Young University')),
(gen_random_uuid(), 'Dr. John Doe', 'john.doe@stanford.edu',
  (SELECT id FROM institutions WHERE name = 'Stanford University')),
(gen_random_uuid(), 'Dr. Maria Garcia', 'maria.garcia@mit.edu',
  (SELECT id FROM institutions WHERE name = 'Massachusetts Institute of Technology'));

INSERT INTO papers (id, title, abstract, publication_date, doi) VALUES
(gen_random_uuid(), 
 'Sustainable Agricultural Practices in Developing Nations',
 'This paper examines the implementation of sustainable agricultural techniques in Sub-Saharan Africa, focusing on crop rotation, water conservation, and soil health management. The study demonstrates significant improvements in yield and environmental impact.',
 '2023-03-15',
 '10.1234/example.2023.001'),
 
(gen_random_uuid(),
 'Climate Change Adaptation Strategies for Coastal Communities',
 'An analysis of climate adaptation measures in Pacific Island nations, including sea wall construction, mangrove restoration, and community relocation planning. The research evaluates effectiveness and cost-benefit ratios.',
 '2023-06-22',
 '10.1234/example.2023.002'),
 
(gen_random_uuid(),
 'Renewable Energy Integration in Smart Grid Systems',
 'This study explores the technical and economic challenges of integrating solar and wind power into existing electrical grids, with case studies from Germany, Denmark, and California.',
 '2023-09-10',
 '10.1234/example.2023.003');

-- Link papers to authors
INSERT INTO author_papers (author_id, paper_id, author_order, is_corresponding)
SELECT 
  a.id,
  p.id,
  1,
  true
FROM authors a
CROSS JOIN papers p
WHERE a.name = 'Dr. Jane Smith'
LIMIT 1;

INSERT INTO paper_sdgs (paper_id, sdg_id, confidence_score)
SELECT p.id, 2, 0.92 FROM papers p WHERE p.title LIKE '%Agricultural%'
UNION ALL
SELECT p.id, 13, 0.85 FROM papers p WHERE p.title LIKE '%Agricultural%'
UNION ALL
SELECT p.id, 13, 0.95 FROM papers p WHERE p.title LIKE '%Climate%'
UNION ALL
SELECT p.id, 11, 0.78 FROM papers p WHERE p.title LIKE '%Climate%'
UNION ALL
SELECT p.id, 7, 0.91 FROM papers p WHERE p.title LIKE '%Renewable Energy%'
UNION ALL
SELECT p.id, 13, 0.82 FROM papers p WHERE p.title LIKE '%Renewable Energy%';