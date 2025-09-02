# DocuTranslate ER Diagram

## Entity Relationship Diagram (ERD)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      USERS      │     │      ROLES      │     │   USER_ROLES    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ 🔑 id (PK)      │     │ 🔑 id (PK)      │     │ 🔑 user_id (FK) │
│ 📝 name         │     │ 📝 name         │     │ 🔑 role_id (FK) │
│ 📧 email        │     │ 📝 display_name │     │ 📅 created_at   │
│ 🔒 password     │     │ 📝 description  │     └─────────────────┘
│ 📊 status       │     │ 📅 created_at   │              │
│ 📅 created_at   │     │ 📅 updated_at   │              │
│ 📅 updated_at   │     └─────────────────┘              │
└─────────────────┘              │                       │
         │                       │                       │
         │                       └───────────────────────┘
         │                                │
         │                                │ Many-to-Many
         │ One-to-Many                    │
         │                                │
         ▼                                ▼
┌─────────────────┐                ┌─────────────────┐
│      FILES      │                │  TRANSLATIONS   │
├─────────────────┤                ├─────────────────┤
│ 🔑 id (PK)      │                │ 🔑 id (PK)      │
│ 🔗 user_id (FK) │                │ 🔗 user_id (FK) │
│ 📝 original_name│                │ 🔗 file_id (FK) │
│ 📝 file_name    │                │ 📝 original_text│
│ 📂 file_path    │                │ 📝 translated_text
│ 📊 file_size    │                │ 🌐 source_language
│ 📄 file_type    │                │ 🌐 target_language
│ 🌐 source_lang  │                │ 📊 status       │
│ 🌐 target_lang  │                │ 💯 confidence   │
│ 📊 status       │                │ 📅 created_at   │
│ 💯 accuracy     │                │ 📅 updated_at   │
│ 📅 created_at   │                └─────────────────┘
│ 📅 updated_at   │                         │
└─────────────────┘                         │
         │                                  │
         │ One-to-Many                      │
         └──────────────────────────────────┘
                        │
                        │ One-to-Many
                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   LANGUAGES     │     │TRANSLATION_HIST │     │  SYSTEM_LOGS    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ 🔑 id (PK)      │     │ 🔑 id (PK)      │     │ 🔑 id (PK)      │
│ 📝 code         │     │ 🔗 user_id (FK) │     │ 🔗 user_id (FK) │
│ 📝 name         │     │ 🔗 trans_id(FK) │     │ 📝 action       │
│ 📝 native_name  │     │ 📝 action_type  │     │ 📝 details      │
│ ✅ is_active    │     │ 📝 details      │     │ 🌐 ip_address   │
│ 📊 priority     │     │ 📅 created_at   │     │ 📊 level        │
│ 📅 created_at   │     └─────────────────┘     │ 📅 created_at   │
│ 📅 updated_at   │              │              └─────────────────┘
└─────────────────┘              │                       │
                                 │                       │
                                 │ Many-to-One           │ Many-to-One
                                 │                       │
                                 ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│PRACTICE_SESSIONS│     │ RAJABASHA_PAPERS│     │RAJABASHA_QUESTIONS
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ 🔑 id (PK)      │     │ 🔑 id (PK)      │     │ 🔑 id (PK)      │
│ 🔗 user_id (FK) │     │ 📝 title        │     │ 🔗 paper_id(FK) │
│ 📝 session_type │     │ 📝 description  │     │ 📝 question_text│
│ 🌐 language     │     │ 🌐 language     │     │ 📝 correct_answer
│ 📊 difficulty   │     │ 🔗 created_by   │     │ 📝 options      │
│ 💯 score        │     │ 📊 quest_count  │     │ 📊 difficulty   │
│ ⏱️ duration     │     │ 📅 created_at   │     │ 📅 created_at   │
│ 📅 created_at   │     │ 📅 updated_at   │     │ 📅 updated_at   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                       │
         │ Many-to-One            │ One-to-Many           │
         └────────────────────────┴───────────────────────┘
                                 │
                                 │ Many-to-One
                                 ▼
                    ┌─────────────────┐
                    │  USER_SESSIONS  │
                    ├─────────────────┤
                    │ 🔑 id (PK)      │
                    │ 🔗 user_id (FK) │
                    │ 🔑 token        │
                    │ 📅 expires_at   │
                    │ 📅 created_at   │
                    └─────────────────┘
```

## Key Relationships:

### 🔗 **Primary Relationships**
- **Users ↔ Roles**: Many-to-Many (via user_roles table)
- **Users → Files**: One-to-Many (one user can upload multiple files)
- **Users → Translations**: One-to-Many (one user can have multiple translations)
- **Files → Translations**: One-to-Many (one file can have multiple translations)
- **Users → System_Logs**: One-to-Many (user activities are logged)
- **Users → Practice_Sessions**: One-to-Many (user practice history)

### 📊 **Secondary Relationships**
- **Translations → Translation_History**: One-to-Many (audit trail)
- **Users → Rajabasha_Papers**: One-to-Many (created by relationship)
- **Rajabasha_Papers → Rajabasha_Questions**: One-to-Many
- **Users → User_Sessions**: One-to-Many (authentication sessions)

### 🌐 **Reference Relationships**
- **Languages**: Referenced by Files and Translations (source_language, target_language)
- **Roles**: Define user permissions and access levels

## Entity Descriptions:

### 👤 **USERS**
Central entity representing system users (regular users, translators, admins)

### 📄 **FILES** 
Uploaded documents for translation with metadata and processing status

### 🔤 **TRANSLATIONS**
Translation results linking users, files, and language pairs

### 🔐 **ROLES**
Permission-based access control (Admin, Translator, User)

### 🌐 **LANGUAGES**
Supported languages for translation services

### 📊 **TRANSLATION_HISTORY**
Audit trail for translation activities

### 🔧 **SYSTEM_LOGS**
System-wide activity and error logging

### 🎯 **PRACTICE_SESSIONS**
Language learning and practice activities

### 📝 **RAJABASHA_PAPERS**
Government exam papers and questions

### 🔑 **USER_SESSIONS**
Authentication and session management
