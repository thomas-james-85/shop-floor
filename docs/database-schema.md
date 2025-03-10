# Manufacturing Terminal System Database Schema

## Sequences

```sql
CREATE SEQUENCE public.app_sections_section_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.app_users_user_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.e2i_operations_e2i_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.efficiency_metrics_metric_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.efficiency_metrics_metric_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.inspection_types_type_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.inspection_types_type_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.job_logs_log_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.job_logs_log_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.machine_state_history_history_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.machine_state_history_history_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.operations_operation_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.reject_reasons_reject_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.rejects_reject_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.rejects_reject_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.terminals_terminal_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.terminals_terminal_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.user_access_access_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.users_user_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

CREATE SEQUENCE public.users_user_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
```

## Tables

### app_sections

```sql
CREATE TABLE public.app_sections (
	section_id serial4 NOT NULL,
	section_name varchar(50) NOT NULL,
	display_name varchar(100) NOT NULL,
	description text NULL,
	icon_name varchar(50) NULL,
	sort_order int4 DEFAULT 0 NULL,
	CONSTRAINT app_sections_pkey PRIMARY KEY (section_id),
	CONSTRAINT app_sections_section_name_key UNIQUE (section_name)
);
```

### app_users

```sql
CREATE TABLE public.app_users (
	user_id serial4 NOT NULL,
	email varchar(255) NOT NULL,
	password_hash varchar(255) NOT NULL,
	full_name varchar(100) NOT NULL,
	is_active bool DEFAULT true NULL,
	is_admin bool DEFAULT false NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	last_login timestamp NULL,
	is_quality_manager bool DEFAULT false NULL,
	CONSTRAINT app_users_email_key UNIQUE (email),
	CONSTRAINT app_users_pkey PRIMARY KEY (user_id)
);

-- Trigger for app_users
CREATE TRIGGER update_app_users_timestamp 
BEFORE UPDATE ON public.app_users 
FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();
```

### customers

```sql
CREATE TABLE public.customers (
	customer_code varchar(20) NOT NULL,
	customer_name varchar(200) NOT NULL,
	active bool DEFAULT true NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT customers_pkey PRIMARY KEY (customer_code)
);

CREATE INDEX idx_customers_active ON public.customers USING btree (active);
CREATE INDEX idx_customers_customer_code ON public.customers USING btree (customer_code);
CREATE INDEX idx_customers_name ON public.customers USING btree (customer_name);
```

### import_progress

```sql
CREATE TABLE public.import_progress (
	progress_id text NOT NULL,
	status text NOT NULL,
	progress int4 NOT NULL,
	"result" jsonb NOT NULL,
	last_updated timestamp NOT NULL,
	CONSTRAINT import_progress_pkey PRIMARY KEY (progress_id)
);

CREATE INDEX idx_import_progress_last_updated ON public.import_progress USING btree (last_updated);
```

### inspection_types

```sql
CREATE TABLE public.inspection_types (
	type_id serial4 NOT NULL,
	"name" varchar(50) NOT NULL,
	description text NULL,
	requires_qty bool DEFAULT false NULL,
	CONSTRAINT inspection_types_pkey PRIMARY KEY (type_id)
);
```

### jobs

```sql
CREATE TABLE public.jobs (
	lookup_code varchar(50) NOT NULL,
	contract_number int4 NOT NULL,
	route_card int4 NOT NULL,
	part_number varchar(50) NOT NULL,
	op_code varchar(20) NOT NULL,
	planned_setup_time numeric NULL,
	planned_run_time numeric NULL,
	quantity int4 NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	customer_code varchar(20) NULL,
	customer_name varchar(200) NULL,
	description text NULL,
	due_date date NULL,
	balance int4 NULL,
	status varchar(20) DEFAULT 'Unstarted'::character varying NULL,
	completed_qty int4 DEFAULT 0 NULL,
	CONSTRAINT jobs_pkey PRIMARY KEY (lookup_code)
);

CREATE INDEX idx_jobs_lookup_code ON public.jobs USING btree (lookup_code);
```

### operations

```sql
CREATE TABLE public.operations (
	operation_id serial4 NOT NULL,
	operation_name varchar(50) NOT NULL,
	operation_description text NULL,
	active bool DEFAULT true NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT operations_operation_name_key UNIQUE (operation_name),
	CONSTRAINT operations_pkey PRIMARY KEY (operation_id)
);
```

### reject_reasons

```sql
CREATE TABLE public.reject_reasons (
	reject_id serial4 NOT NULL,
	reject_name varchar(100) NOT NULL,
	description text NULL,
	active bool DEFAULT true NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT reject_reasons_pkey PRIMARY KEY (reject_id),
	CONSTRAINT reject_reasons_reject_name_key UNIQUE (reject_name)
);
```

### rejects

```sql
CREATE TABLE public.rejects (
	reject_id serial4 NOT NULL,
	customer_name varchar(200) NOT NULL,
	contract_number int4 NOT NULL,
	route_card int4 NOT NULL,
	part_number varchar(50) NOT NULL,
	qty_rejected int4 NOT NULL,
	operator_id varchar(20) NOT NULL,
	supervisor_id varchar(20) NOT NULL,
	reason varchar(100) NOT NULL,
	remanufacture_qty int4 NOT NULL,
	machine_id varchar(50) NOT NULL,
	operation_code varchar(20) NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT rejects_pkey PRIMARY KEY (reject_id)
);
```

### terminals

```sql
CREATE TABLE public.terminals (
	terminal_id serial4 NOT NULL,
	terminal_name varchar(50) NOT NULL,
	operation_code varchar(20) NOT NULL,
	description text NULL,
	"password" varchar(100) NOT NULL,
	active bool DEFAULT true NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT terminals_pkey PRIMARY KEY (terminal_id),
	CONSTRAINT terminals_terminal_name_key UNIQUE (terminal_name)
);
```

### users

```sql
CREATE TABLE public.users (
	user_id serial4 NOT NULL,
	employee_id varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	active bool DEFAULT true NULL,
	can_operate bool DEFAULT false NULL,
	can_setup bool DEFAULT false NULL,
	can_inspect bool DEFAULT false NULL,
	can_remanufacture bool DEFAULT false NULL,
	CONSTRAINT users_employee_id_key1 UNIQUE (employee_id),
	CONSTRAINT users_pkey1 PRIMARY KEY (user_id)
);
```

### e2i_operations

```sql
CREATE TABLE public.e2i_operations (
	e2i_id serial4 NOT NULL,
	e2i_code varchar(50) NOT NULL,
	operation_id int4 NOT NULL,
	active bool DEFAULT true NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT e2i_operations_e2i_code_key UNIQUE (e2i_code),
	CONSTRAINT e2i_operations_pkey PRIMARY KEY (e2i_id),
	CONSTRAINT fk_operation FOREIGN KEY (operation_id) REFERENCES public.operations(operation_id) ON DELETE RESTRICT
);

CREATE INDEX idx_e2i_operations_code ON public.e2i_operations USING btree (e2i_code);
```

### job_logs

```sql
CREATE TABLE public.job_logs (
	log_id serial4 NOT NULL,
	lookup_code varchar(50) NULL,
	user_id varchar(20) NOT NULL,
	state varchar(20) NOT NULL,
	start_time timestamp NOT NULL,
	end_time timestamp NULL,
	inspection_passed bool NULL,
	"comments" text NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	machine_id varchar(50) NULL,
	inspection_type varchar(20) NULL,
	inspection_qty int4 NULL,
	completed_qty int4 NULL,
	operation_id int4 NULL,
	CONSTRAINT job_logs_pkey PRIMARY KEY (log_id),
	CONSTRAINT fk_job_logs_operation FOREIGN KEY (operation_id) REFERENCES public.operations(operation_id),
	CONSTRAINT job_logs_lookup_code_fkey FOREIGN KEY (lookup_code) REFERENCES public.jobs(lookup_code)
);

CREATE INDEX idx_job_logs_lookup ON public.job_logs USING btree (lookup_code);
CREATE INDEX idx_job_logs_operation_id ON public.job_logs USING btree (operation_id);
```

### machine_state_history

```sql
CREATE TABLE public.machine_state_history (
	history_id serial4 NOT NULL,
	machine_id varchar(50) NOT NULL,
	state varchar(20) NOT NULL,
	operator_id varchar(20) NULL,
	start_time timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	end_time timestamp NULL,
	elapsed_time interval NULL,
	CONSTRAINT machine_state_history_pkey PRIMARY KEY (history_id),
	CONSTRAINT machine_state_history_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.users(employee_id)
);
```

### operation_rejects

```sql
CREATE TABLE public.operation_rejects (
	operation_id int4 NOT NULL,
	reject_id int4 NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT operation_rejects_pkey PRIMARY KEY (operation_id, reject_id),
	CONSTRAINT fk_operation FOREIGN KEY (operation_id) REFERENCES public.operations(operation_id) ON DELETE CASCADE,
	CONSTRAINT fk_reject FOREIGN KEY (reject_id) REFERENCES public.reject_reasons(reject_id) ON DELETE CASCADE
);
```

### user_access

```sql
CREATE TABLE public.user_access (
	access_id serial4 NOT NULL,
	user_id int4 NOT NULL,
	"section" varchar(50) NOT NULL,
	can_view bool DEFAULT false NULL,
	can_edit bool DEFAULT false NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT user_access_pkey PRIMARY KEY (access_id),
	CONSTRAINT user_access_user_id_section_key UNIQUE (user_id, section),
	CONSTRAINT user_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(user_id) ON DELETE CASCADE
);

-- Trigger for user_access
CREATE TRIGGER update_user_access_timestamp 
BEFORE UPDATE ON public.user_access 
FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();
```

### efficiency_metrics

```sql
CREATE TABLE public.efficiency_metrics (
	metric_id serial4 NOT NULL,
	job_log_id int4 NULL,
	lookup_code varchar(50) NULL,
	operator_id varchar(20) NULL,
	machine_id varchar(50) NULL,
	metric_type varchar(20) NULL,
	planned_time numeric NULL,
	actual_time numeric NULL,
	planned_qty int4 NULL,
	completed_qty int4 NULL,
	efficiency_percentage numeric NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	time_saved numeric NULL,
	CONSTRAINT efficiency_metrics_pkey PRIMARY KEY (metric_id),
	CONSTRAINT efficiency_metrics_job_log_id_fkey FOREIGN KEY (job_log_id) REFERENCES public.job_logs(log_id),
	CONSTRAINT efficiency_metrics_lookup_code_fkey FOREIGN KEY (lookup_code) REFERENCES public.jobs(lookup_code),
	CONSTRAINT efficiency_metrics_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.users(employee_id)
);

CREATE INDEX idx_efficiency_date ON public.efficiency_metrics USING btree (created_at);
```

## Functions

```sql
CREATE OR REPLACE FUNCTION public.update_modified_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$;
```
