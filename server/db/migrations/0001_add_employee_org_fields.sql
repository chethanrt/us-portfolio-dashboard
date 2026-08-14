ALTER TABLE employees ADD COLUMN leader_id TEXT REFERENCES employees(id);
ALTER TABLE employees ADD COLUMN business_unit TEXT NOT NULL DEFAULT '';
ALTER TABLE employees ADD COLUMN tech_non_tech TEXT NOT NULL DEFAULT 'Tech';
