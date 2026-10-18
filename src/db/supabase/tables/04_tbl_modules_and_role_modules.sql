CREATE TABLE IF NOT EXISTS tbl_modules (
  module_code VARCHAR(50) PRIMARY KEY,
  module_name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS tbl_role_modules (
  id SERIAL PRIMARY KEY,
  role_code VARCHAR(20) NOT NULL REFERENCES tbl_roles(role_code) ON DELETE CASCADE,
  module_code VARCHAR(50) NOT NULL REFERENCES tbl_modules(module_code) ON DELETE CASCADE,
  can_view BOOLEAN NOT NULL DEFAULT FALSE,
  can_create BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(role_code, module_code)
);