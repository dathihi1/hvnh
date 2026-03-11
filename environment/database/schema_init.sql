-- ==========================================
-- RESET DATABASE (FOR DEVELOPMENT)
-- Drop tables in reverse dependency order
-- ==========================================

DROP TABLE IF EXISTS answer_options CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS form_responses CASCADE;
DROP TABLE IF EXISTS grid_rows CASCADE;
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS form_sections CASCADE;
DROP TABLE IF EXISTS forms CASCADE;

DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS organization_documents CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;

DROP TABLE IF EXISTS club_applications CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS activities CASCADE;

DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==========================================
-- CORE TABLES
-- ==========================================

-- USERS
CREATE TABLE users (
    "userId"      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "userName"    VARCHAR(255) NOT NULL,
    "studentId"   VARCHAR(50),
    "university"  VARCHAR(255) NOT NULL,
    "phoneNumber" VARCHAR(20) UNIQUE,
    "email"       VARCHAR(255) UNIQUE NOT NULL,
    "password"    VARCHAR(255) NOT NULL,
    "status"      VARCHAR(20) DEFAULT 'active'
                      CHECK ("status" IN ('active','inactive','banned','suspended')),
    "avatarUrl"   TEXT,

    "isDeleted"   BOOLEAN   DEFAULT FALSE,
    "createdAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"   TIMESTAMP,
    "createdBy"   INT,
    "updatedBy"   INT,
    "deletedBy"   INT,

    UNIQUE ("studentId", "university")
);

-- ORGANIZATIONS
CREATE TABLE organizations (
    "organizationId"   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "organizationName" VARCHAR(255) NOT NULL,
    "organizationType" VARCHAR(50)  NOT NULL
                           CHECK ("organizationType" IN ('university','club','department','company')),
    "logoUrl"          TEXT,
    "coverImageUrl"    TEXT,
    "description"      TEXT,

    "isDeleted"        BOOLEAN   DEFAULT FALSE,
    "createdAt"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"        TIMESTAMP,
    "createdBy"        INT,
    "updatedBy"        INT,
    "deletedBy"        INT
);

-- ORGANIZATION MEMBERS
CREATE TABLE organization_members (
    "userId"         INT,
    "organizationId" INT,
    "role"           VARCHAR(50)
                         CHECK ("role" IN ('president','vice_president','head_of_department','vice_head','leader','member')),
    "joinDate"       DATE,

    PRIMARY KEY ("userId", "organizationId"),

    "isDeleted"      BOOLEAN   DEFAULT FALSE,
    "createdAt"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"      TIMESTAMP,
    "createdBy"      INT,
    "updatedBy"      INT,
    "deletedBy"      INT
);

-- ORGANIZATION DOCUMENTS
CREATE TABLE organization_documents (
    "documentId"     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "documentName"   VARCHAR(255) NOT NULL,
    "fileUrl"        TEXT NOT NULL,
    "category"       VARCHAR(50),
    "organizationId" INT NOT NULL,
    "userId"         INT NOT NULL,

    "isDeleted"      BOOLEAN   DEFAULT FALSE,
    "createdAt"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"      TIMESTAMP,
    "createdBy"      INT,
    "updatedBy"      INT,
    "deletedBy"      INT
);

-- ==========================================
-- ACTIVITIES
-- ==========================================

CREATE TABLE activities (
    "activityId"   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "activityName" VARCHAR(255) NOT NULL,
    "location"     VARCHAR(255),

    -- Type & category
    "type"     VARCHAR(50) NOT NULL
                   CHECK ("type" IN ('program','competition','recruitment')),
    "category" VARCHAR(50)
                   CHECK ("category" IN ('academic','non_academic')),

    -- Time windows
    "startTime"                 TIMESTAMP,
    "endTime"                   TIMESTAMP,
    "formRegistrationStartTime" TIMESTAMP,
    "formRegistrationEndTime"   TIMESTAMP,
    "checkInStart"              TIMESTAMP,
    "checkInEnd"                TIMESTAMP,

    CONSTRAINT check_activity_time
        CHECK ("endTime" IS NULL OR "endTime" > "startTime"),
    CONSTRAINT check_register_time
        CHECK ("formRegistrationEndTime" IS NULL
            OR "formRegistrationEndTime" > "formRegistrationStartTime"),
    CONSTRAINT check_checkin_time
        CHECK ("checkInEnd" IS NULL OR "checkInEnd" > "checkInStart"),

    -- Team mode
    "teamMode"       VARCHAR(20) DEFAULT 'individual'
                         CHECK ("teamMode" IN ('individual','team','both')),
    "minTeamMembers" INT,
    "maxTeamMembers" INT,

    CONSTRAINT check_team_size
        CHECK ("teamMode" = 'individual'
            OR ("minTeamMembers" IS NOT NULL
                AND "maxTeamMembers" IS NOT NULL
                AND "maxTeamMembers" >= "minTeamMembers")),

    -- Capacity & approval
    "maxParticipants" INT,
    "approvalStatus"  VARCHAR(50) DEFAULT 'pending'
                          CHECK ("approvalStatus" IN ('pending','approved','rejected')),
    "prize"           TEXT,
    "coverImage"      TEXT,
    "description"     TEXT,
    "activityStatus"  VARCHAR(50) DEFAULT 'draft'
                          CHECK ("activityStatus" IN ('draft','published','running','finished','cancelled')),

    "organizationId"  INT NOT NULL,

    "isDeleted"       BOOLEAN   DEFAULT FALSE,
    "createdAt"       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"       TIMESTAMP,
    "createdBy"       INT,
    "updatedBy"       INT,
    "deletedBy"       INT
);

-- REGISTRATIONS
CREATE TABLE registrations (
    "registrationId"        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "status"                VARCHAR(50) DEFAULT 'pending'
                                CHECK ("status" IN ('pending','approved','rejected','cancelled')),
    "registrationTimeStart" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "registrationType"      VARCHAR(50) DEFAULT 'individual'
                                CHECK ("registrationType" IN ('individual','group')),
    "checkInTime"           TIMESTAMP,
    "checkOutTime"          TIMESTAMP,
    "userId"                INT NOT NULL,
    "activityId"            INT NOT NULL,

    "isDeleted"             BOOLEAN   DEFAULT FALSE,
    "createdAt"             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"             TIMESTAMP,
    "createdBy"             INT,
    "updatedBy"             INT,
    "deletedBy"             INT,

    UNIQUE ("userId", "activityId")
);

-- TEAM MEMBERS
CREATE TABLE team_members (
    "registrationId" INT,
    "userId"         INT,
    "role"           VARCHAR(50) CHECK ("role" IN ('leader','member')),

    PRIMARY KEY ("registrationId", "userId"),

    "isDeleted"      BOOLEAN   DEFAULT FALSE,
    "createdAt"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"      TIMESTAMP,
    "createdBy"      INT,
    "updatedBy"      INT,
    "deletedBy"      INT
);

-- CLUB APPLICATIONS (for recruitment activities)
CREATE TABLE club_applications (
    "applicationId" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "answers"       TEXT,
    "submittedAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "interviewTime" TIMESTAMP,
    "result"        VARCHAR(50) DEFAULT 'pending'
                        CHECK ("result" IN ('pending','interview','accepted','rejected')),
    "note"          TEXT,
    "activityId"    INT NOT NULL,
    "userId"        INT NOT NULL,

    UNIQUE ("activityId", "userId"),

    "isDeleted"     BOOLEAN   DEFAULT FALSE,
    "createdAt"     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"     TIMESTAMP,
    "createdBy"     INT,
    "updatedBy"     INT,
    "deletedBy"     INT
);

-- REVIEWS
CREATE TABLE reviews (
    "reviewId"       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "rating"         INT NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
    "comment"        TEXT,
    "reviewTime"     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "registrationId" INT UNIQUE NOT NULL,

    "isDeleted"      BOOLEAN   DEFAULT FALSE,
    "createdAt"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"      TIMESTAMP,
    "createdBy"      INT,
    "updatedBy"      INT,
    "deletedBy"      INT
);

-- ==========================================
-- SYSTEM
-- ==========================================

-- SYSTEM LOGS
CREATE TABLE system_logs (
    "logId"         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "action"        VARCHAR(255),
    "executionTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "oldData"       TEXT,
    "newData"       TEXT,
    "userId"        INT NOT NULL,

    "isDeleted"     BOOLEAN   DEFAULT FALSE,
    "createdAt"     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"     TIMESTAMP,
    "createdBy"     INT,
    "updatedBy"     INT,
    "deletedBy"     INT
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    "notificationId"   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "title"            VARCHAR(255) NOT NULL,
    "content"          TEXT,
    "notificationTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "status"           VARCHAR(50) DEFAULT 'unread'
                           CHECK ("status" IN ('unread','read')),
    "notificationType" VARCHAR(50)
                           CHECK ("notificationType" IN ('activity','registration','system')),
    "userId"           INT NOT NULL,

    "isDeleted"        BOOLEAN   DEFAULT FALSE,
    "createdAt"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"        TIMESTAMP,
    "createdBy"        INT,
    "updatedBy"        INT,
    "deletedBy"        INT
);

-- ==========================================
-- ROLES & PERMISSIONS (RBAC)
-- ==========================================

-- ROLES
CREATE TABLE roles (
    "roleId"      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "code"        VARCHAR(50) UNIQUE NOT NULL
                      CHECK ("code" IN ('admin','student','organization_leader','organization_member')),
    "roleName"    VARCHAR(255) UNIQUE NOT NULL,
    "description" TEXT,

    "isDeleted"   BOOLEAN   DEFAULT FALSE,
    "createdAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"   TIMESTAMP,
    "createdBy"   INT,
    "updatedBy"   INT,
    "deletedBy"   INT
);

-- USER ROLES
CREATE TABLE user_roles (
    "userId"    INT,
    "roleId"    INT,

    PRIMARY KEY ("userId", "roleId"),

    "isDeleted" BOOLEAN   DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP,
    "createdBy" INT,
    "updatedBy" INT,
    "deletedBy" INT
);

-- PERMISSIONS
CREATE TABLE permissions (
    "permissionId" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "code"         VARCHAR(100) UNIQUE NOT NULL,
    "name"         VARCHAR(255) NOT NULL,
    "description"  TEXT,
    "resource"     VARCHAR(100),
    "action"       VARCHAR(50),

    "isDeleted"    BOOLEAN   DEFAULT FALSE,
    "createdAt"    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy"    INT,
    "updatedBy"    INT,
    "deletedBy"    INT
);

-- ROLE PERMISSIONS
CREATE TABLE role_permissions (
    "roleId"       INT,
    "permissionId" INT,

    PRIMARY KEY ("roleId", "permissionId"),

    "isDeleted"    BOOLEAN   DEFAULT FALSE,
    "createdAt"    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy"    INT,
    "updatedBy"    INT,
    "deletedBy"    INT
);

-- ==========================================
-- FORMS (Google Forms style)
-- ==========================================

-- FORMS — top-level form metadata
CREATE TABLE forms (
    "formId"              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "title"               VARCHAR(255) NOT NULL,
    "description"         TEXT,
    "headerImageUrl"      TEXT,
    "confirmationMessage" TEXT,

    "status"              VARCHAR(20) DEFAULT 'draft'
                              CHECK ("status" IN ('draft','open','closed')),
    "openAt"              TIMESTAMP,
    "closeAt"             TIMESTAMP,
    "responseLimit"       INT,

    "collectEmail"        BOOLEAN DEFAULT FALSE,
    "limitOneResponse"    BOOLEAN DEFAULT TRUE,
    "allowEditResponse"   BOOLEAN DEFAULT FALSE,
    "showProgressBar"     BOOLEAN DEFAULT FALSE,
    "shuffleQuestions"    BOOLEAN DEFAULT FALSE,
    "requireSignIn"       BOOLEAN DEFAULT TRUE,

    "activityId"          INT,

    "isDeleted"           BOOLEAN   DEFAULT FALSE,
    "createdAt"           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"           TIMESTAMP,
    "createdBy"           INT,
    "updatedBy"           INT,
    "deletedBy"           INT
);

-- FORM SECTIONS
CREATE TABLE form_sections (
    "sectionId"      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "title"          VARCHAR(255) DEFAULT 'Untitled Section',
    "description"    TEXT,
    "order"          INT DEFAULT 0,
    "navigationType" VARCHAR(20)  DEFAULT 'next'
                         CHECK ("navigationType" IN ('next','submit','go_to_section')),
    "formId"         INT NOT NULL,

    "isDeleted"      BOOLEAN   DEFAULT FALSE,
    "createdAt"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QUESTIONS
-- Types: short_text, paragraph, multiple_choice, checkboxes, dropdown,
--        file_upload, linear_scale, rating, date, time,
--        multiple_choice_grid, checkbox_grid
CREATE TABLE questions (
    "questionId"       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "title"            VARCHAR(500) NOT NULL,
    "description"      TEXT,
    "type"             VARCHAR(50) NOT NULL
                           CHECK ("type" IN (
                               'short_text','paragraph',
                               'multiple_choice','checkboxes','dropdown',
                               'file_upload',
                               'linear_scale','rating',
                               'date','time',
                               'multiple_choice_grid','checkbox_grid'
                           )),
    "order"            INT DEFAULT 0,
    "required"         BOOLEAN DEFAULT FALSE,

    "scaleMin"         INT DEFAULT 1,
    "scaleMax"         INT DEFAULT 5,
    "scaleMinLabel"    VARCHAR(100),
    "scaleMaxLabel"    VARCHAR(100),

    "allowedFileTypes" TEXT[],
    "maxFileSize"      INT DEFAULT 10,
    "maxFiles"         INT DEFAULT 1,

    "imageUrl"         TEXT,
    "videoUrl"         TEXT,

    "validationRules"  JSONB,
    "displayCondition" JSONB,

    "sectionId"        INT NOT NULL,

    "isDeleted"        BOOLEAN   DEFAULT FALSE,
    "createdAt"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QUESTION OPTIONS — choices for multiple_choice / checkboxes / dropdown / grid columns
CREATE TABLE question_options (
    "optionId"      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "label"         VARCHAR(500) NOT NULL,
    "order"         INT DEFAULT 0,
    "isOther"       BOOLEAN DEFAULT FALSE,
    "imageUrl"      TEXT,
    "goToSectionId" INT,

    "questionId"    INT NOT NULL,

    "isDeleted"     BOOLEAN   DEFAULT FALSE,
    "createdAt"     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GRID ROWS — row labels for multiple_choice_grid / checkbox_grid
CREATE TABLE grid_rows (
    "rowId"      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "label"      VARCHAR(500) NOT NULL,
    "order"      INT DEFAULT 0,
    "questionId" INT NOT NULL,

    "isDeleted"  BOOLEAN   DEFAULT FALSE,
    "createdAt"  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FORM RESPONSES — one record per submission
CREATE TABLE form_responses (
    "responseId"      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "respondentEmail" VARCHAR(255),
    "status"          VARCHAR(20) DEFAULT 'submitted'
                          CHECK ("status" IN ('submitted','approved','rejected')),
    "submittedAt"     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    "formId"          INT NOT NULL,
    "userId"          INT,

    "isDeleted"       BOOLEAN   DEFAULT FALSE,
    "createdAt"       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"       TIMESTAMP,
    "deletedBy"       INT
);

-- ANSWERS — one record per question per response
CREATE TABLE answers (
    "answerId"   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "textValue"  TEXT,
    "fileUrl"    TEXT,
    "questionId" INT NOT NULL,
    "responseId" INT NOT NULL,

    "isDeleted"  BOOLEAN   DEFAULT FALSE,
    "createdAt"  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ANSWER OPTIONS — selected choices for choice/grid answers
CREATE TABLE answer_options (
    "answerOptionId" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "answerId"       INT NOT NULL,
    "optionId"       INT NOT NULL,
    "rowId"          INT,
    "otherText"      TEXT,

    "isDeleted"      BOOLEAN   DEFAULT FALSE,
    "createdAt"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES
-- ==========================================

-- USERS
CREATE INDEX idx_users_email   ON users("email");
CREATE INDEX idx_users_student ON users("studentId", "university");

-- ORGANIZATIONS
CREATE INDEX idx_org_members_organization ON organization_members("organizationId");
CREATE INDEX idx_org_members_user         ON organization_members("userId");

-- ACTIVITIES
CREATE INDEX idx_activities_organization ON activities("organizationId");
CREATE INDEX idx_activities_type         ON activities("type");
CREATE INDEX idx_activities_status       ON activities("approvalStatus", "activityStatus");

-- REGISTRATIONS
CREATE INDEX idx_registrations_activity ON registrations("activityId");
CREATE INDEX idx_registrations_user     ON registrations("userId");

-- TEAM MEMBERS
CREATE INDEX idx_team_members_registration ON team_members("registrationId");
CREATE INDEX idx_team_members_user         ON team_members("userId");

-- NOTIFICATIONS
CREATE INDEX idx_notifications_user      ON notifications("userId");
CREATE INDEX idx_notifications_user_time ON notifications("userId", "notificationTime" DESC);

-- SYSTEM LOGS
CREATE INDEX idx_system_logs_user ON system_logs("userId");

-- ROLES & PERMISSIONS
CREATE INDEX idx_user_roles_user ON user_roles("userId");
CREATE INDEX idx_user_roles_role ON user_roles("roleId");

-- FORMS
CREATE INDEX idx_forms_activity      ON forms("activityId");
CREATE INDEX idx_forms_status        ON forms("status");
CREATE INDEX idx_form_sections_form  ON form_sections("formId");
CREATE INDEX idx_questions_section   ON questions("sectionId");
CREATE INDEX idx_form_responses_form ON form_responses("formId");
CREATE INDEX idx_form_responses_user ON form_responses("userId");
CREATE INDEX idx_answers_response    ON answers("responseId");
CREATE INDEX idx_answers_question    ON answers("questionId");
