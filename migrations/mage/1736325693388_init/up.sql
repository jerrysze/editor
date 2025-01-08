SET check_function_bodies = false;
CREATE TABLE public.annotations (
    version double precision NOT NULL,
    annotation_stroke jsonb,
    score double precision,
    comment text,
    author text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    question_information_id integer NOT NULL,
    file_id integer NOT NULL,
    offset_start integer NOT NULL,
    offset_end integer NOT NULL
);
CREATE TABLE public.appeals (
    id integer NOT NULL,
    question_id integer NOT NULL,
    user_id text NOT NULL,
    appeal_text text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    ta_id text NOT NULL,
    exam_id integer NOT NULL
);
CREATE SEQUENCE public.appeals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.appeals_id_seq OWNED BY public.appeals.id;
CREATE TABLE public.courses (
    course_code text NOT NULL,
    course_name text,
    semester_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.editor_collections (
    collection_name text NOT NULL,
    parent_id text,
    collection_id text NOT NULL,
    deleted boolean DEFAULT false NOT NULL
);
CREATE TABLE public.editor_files (
    content text NOT NULL,
    file_name text NOT NULL,
    file_id text NOT NULL,
    collection_id text,
    metadata jsonb
);
CREATE TABLE public.error_submissions (
    file_id integer NOT NULL,
    offset_start integer NOT NULL,
    offset_end integer NOT NULL,
    error_type text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.exams (
    id integer NOT NULL,
    course_code text NOT NULL,
    semester_id integer NOT NULL,
    grading_deadline timestamp without time zone,
    exam_name text NOT NULL,
    exam_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    student_list jsonb
);
CREATE SEQUENCE public.exams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.exams_id_seq OWNED BY public.exams.id;
CREATE TABLE public.files (
    id integer NOT NULL,
    path text NOT NULL,
    pages integer NOT NULL,
    type text NOT NULL,
    exam_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE public.files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.files_id_seq OWNED BY public.files.id;
CREATE TABLE public.job_status (
    id integer NOT NULL,
    exam_id integer NOT NULL,
    task_type text NOT NULL,
    status text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    message jsonb,
    "isRead" jsonb DEFAULT '[]'::jsonb
);
CREATE SEQUENCE public.job_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.job_status_id_seq OWNED BY public.job_status.id;
CREATE TABLE public.question_information (
    id integer NOT NULL,
    exam_id integer NOT NULL,
    marking_scheme_text text,
    score integer NOT NULL,
    question_label text NOT NULL,
    answer_coordinates jsonb,
    marking_scheme_coordinates jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    question_text text,
    question_coordinates jsonb,
    person_in_charge text
);
CREATE SEQUENCE public.question_information_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.question_information_id_seq OWNED BY public.question_information.id;
CREATE TABLE public.question_submissions (
    question_information_id integer NOT NULL,
    file_id integer NOT NULL,
    offset_start integer NOT NULL,
    offset_end integer NOT NULL,
    ocr_answer text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.semesters (
    semester_id integer NOT NULL,
    semester_name text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.submissions (
    file_id integer NOT NULL,
    offset_start integer NOT NULL,
    offset_end integer NOT NULL,
    ocr_results jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.user_course (
    itsc text NOT NULL,
    course_code text NOT NULL,
    semester_id integer NOT NULL,
    role text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.users (
    itsc text NOT NULL,
    name text,
    email text,
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.appeals ALTER COLUMN id SET DEFAULT nextval('public.appeals_id_seq'::regclass);
ALTER TABLE ONLY public.exams ALTER COLUMN id SET DEFAULT nextval('public.exams_id_seq'::regclass);
ALTER TABLE ONLY public.files ALTER COLUMN id SET DEFAULT nextval('public.files_id_seq'::regclass);
ALTER TABLE ONLY public.job_status ALTER COLUMN id SET DEFAULT nextval('public.job_status_id_seq'::regclass);
ALTER TABLE ONLY public.question_information ALTER COLUMN id SET DEFAULT nextval('public.question_information_id_seq'::regclass);
ALTER TABLE ONLY public.annotations
    ADD CONSTRAINT annotations_pkey PRIMARY KEY (version, file_id, offset_start, offset_end, question_information_id);
ALTER TABLE ONLY public.appeals
    ADD CONSTRAINT appeals_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (course_code, semester_id);
ALTER TABLE ONLY public.editor_collections
    ADD CONSTRAINT editor_collections_pkey PRIMARY KEY (collection_id);
ALTER TABLE ONLY public.editor_files
    ADD CONSTRAINT editor_files_pkey PRIMARY KEY (file_id);
ALTER TABLE ONLY public.error_submissions
    ADD CONSTRAINT error_submissions_pkey PRIMARY KEY (file_id, offset_start, offset_end);
ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.job_status
    ADD CONSTRAINT job_status_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.question_information
    ADD CONSTRAINT question_information_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.question_submissions
    ADD CONSTRAINT question_submissions_pkey PRIMARY KEY (question_information_id, file_id, offset_start, offset_end);
ALTER TABLE ONLY public.semesters
    ADD CONSTRAINT semesters_pkey PRIMARY KEY (semester_id);
ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (file_id, offset_start, offset_end);
ALTER TABLE ONLY public.user_course
    ADD CONSTRAINT user_course_pkey PRIMARY KEY (itsc, course_code, semester_id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (itsc);
ALTER TABLE ONLY public.annotations
    ADD CONSTRAINT annotations_offset_start_question_information_id_file_id_off FOREIGN KEY (offset_start, question_information_id, file_id, offset_end) REFERENCES public.question_submissions(offset_start, question_information_id, file_id, offset_end) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.appeals
    ADD CONSTRAINT appeals_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.appeals
    ADD CONSTRAINT appeals_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.question_information(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.appeals
    ADD CONSTRAINT appeals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(itsc) ON UPDATE SET NULL ON DELETE SET NULL;
ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_semester_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(semester_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.editor_files
    ADD CONSTRAINT editor_files_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.editor_collections(collection_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.error_submissions
    ADD CONSTRAINT error_submissions_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_course_code_semester_fkey FOREIGN KEY (course_code, semester_id) REFERENCES public.courses(course_code, semester_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.job_status
    ADD CONSTRAINT job_status_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.question_information
    ADD CONSTRAINT question_information_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.question_information
    ADD CONSTRAINT question_information_person_in_charge_fkey FOREIGN KEY (person_in_charge) REFERENCES public.users(itsc) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.question_submissions
    ADD CONSTRAINT question_submissions_offset_end_offset_start_file_id_fkey FOREIGN KEY (offset_end, offset_start, file_id) REFERENCES public.submissions(offset_end, offset_start, file_id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.question_submissions
    ADD CONSTRAINT question_submissions_question_information_id_fkey FOREIGN KEY (question_information_id) REFERENCES public.question_information(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.user_course
    ADD CONSTRAINT user_course_itsc_fkey FOREIGN KEY (itsc) REFERENCES public.users(itsc) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.user_course
    ADD CONSTRAINT user_course_semester_course_code_fkey FOREIGN KEY (semester_id, course_code) REFERENCES public.courses(semester_id, course_code) ON UPDATE RESTRICT ON DELETE RESTRICT;
