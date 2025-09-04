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
│ � preferences  │     │ 📅 updated_at   │              │
│ 🎯 skill_level  │     └─────────────────┘              │
│ 📅 last_login   │              │                       │
│ 📅 created_at   │              │                       │
│ 📅 updated_at   │              └───────────────────────┘
└─────────────────┘                       │
         │                                │ Many-to-Many
         │                                │
         │ One-to-Many                    │
         │                                │
         ▼                                ▼
┌─────────────────┐                ┌─────────────────┐
│      FILES      │                │  TRANSLATIONS   │
├─────────────────┤                ├─────────────────┤
│ 🔑 id (PK)      │                │ 🔑 id (PK)      │
│ 🔗 user_id (FK) │                │ 🔗 user_id (FK) │
│ � project_id(FK)│               │ 🔗 file_id (FK) │
│ 📝 original_name│                │ 📝 original_text│
│ � file_name    │                │ 📝 translated_text
│ � file_path    │                │ 🌐 source_language
│ � file_size    │                │ 🌐 target_language
│ 📄 file_type    │                │ 📊 status       │
│ 🌐 source_lang  │                │ 💯 confidence   │
│ 🌐 target_lang  │                │ 🤖 ai_suggestions│
│ 📊 status       │                │ ⏱️ processing_time
│ 💯 accuracy     │                │ � cost         │
│ 🔒 permissions  │                │ 📅 created_at   │
│ 📅 created_at   │                │ 📅 updated_at   │
│ 📅 updated_at   │                └─────────────────┘
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
│ ✅ is_active    │     │ 📝 old_value    │     │ 🌐 ip_address   │
│ 📊 priority     │     │ � new_value    │     │ 📊 level        │
│ 🤖 ai_supported │     │ 📝 details      │     │ 📊 severity     │
│ 📅 created_at   │     │ 📅 created_at   │     │ 📅 created_at   │
│ 📅 updated_at   │     └─────────────────┘     └─────────────────┘
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
│ ⏱️ duration     │     │ 🎖️ certificate │     │ � points       │
│ 🎯 objectives   │     │ �📅 created_at   │     │ 📅 created_at   │
│ 📅 created_at   │     │ 📅 updated_at   │     │ 📅 updated_at   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                       │
         │ Many-to-One            │ One-to-Many           │
         └────────────────────────┴───────────────────────┘

    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
    │    PROJECTS     │     │   COLLABORATORS │     │    COMMENTS     │
    ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
    │ 🔑 id (PK)      │     │ 🔑 id (PK)      │     │ 🔑 id (PK)      │
    │ 📝 name         │     │ 🔗 project_id(FK)│    │ 🔗 user_id (FK) │
    │ 📝 description  │     │ 🔗 user_id (FK) │     │ 🔗 trans_id(FK) │
    │ 🔗 owner_id (FK)│     │ 📝 role         │     │ 🔗 file_id (FK) │
    │ 📊 status       │     │ 🔒 permissions  │     │ 📝 content      │
    │ 🎯 deadline     │     │ 📅 joined_at    │     │ 🏷️ type         │
    │ 📊 progress     │     │ 📅 created_at   │     │ 🔗 parent_id(FK)│
    │ 🔒 visibility   │     └─────────────────┘     │ 📊 status       │
    │ 📅 created_at   │              │              │ 📅 created_at   │
    │ 📅 updated_at   │              │              │ 📅 updated_at   │
    └─────────────────┘              │              └─────────────────┘
             │                       │                       │
             │ One-to-Many           │ Many-to-Many          │ Many-to-One
             └───────────────────────┘                       │
                                    │                        │
                                    ▼                        ▼
    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
    │  NOTIFICATIONS  │     │    ANALYTICS    │     │   API_TOKENS    │
    ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
    │ 🔑 id (PK)      │     │ 🔑 id (PK)      │     │ 🔑 id (PK)      │
    │ 🔗 user_id (FK) │     │ 🔗 user_id (FK) │     │ 🔗 user_id (FK) │
    │ 📝 title        │     │ 📊 metric_type  │     │ 📝 name         │
    │ 📝 message      │     │ 📝 metric_value │     │ 🔑 token_hash   │
    │ 🏷️ type         │     │ 📅 date         │     │ 🔒 permissions  │
    │ 📊 priority     │     │ 📊 category     │     │ 📊 usage_count  │
    │ ✅ is_read      │     │ 🔗 resource_id  │     │ 📅 expires_at   │
    │ 📱 channels     │     │ 📝 metadata     │     │ 📅 last_used    │
    │ 📅 sent_at      │     │ 📅 created_at   │     │ 📅 created_at   │
    │ 📅 read_at      │     └─────────────────┘     └─────────────────┘
    │ 📅 created_at   │              │                       │
    └─────────────────┘              │                       │
             │                       │ Many-to-One           │ Many-to-One
             │ Many-to-One           │                       │
             │                       ▼                       ▼
    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
    │  VOICE_SESSIONS │     │   CERTIFICATES  │     │    WEBHOOKS     │
    ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
    │ 🔑 id (PK)      │     │ 🔑 id (PK)      │     │ 🔑 id (PK)      │
    │ 🔗 user_id (FK) │     │ 🔗 user_id (FK) │     │ 🔗 user_id (FK) │
    │ 🎤 audio_file   │     │ 📝 name         │     │ 📝 name         │
    │ 📝 original_text│     │ 🏷️ type         │     │ 🔗 url          │
    │ 📝 transcription│     │ 🌐 language     │     │ 🎯 events       │
    │ 🌐 source_lang  │     │ 📊 level        │     │ 🔒 secret       │
    │ 🌐 target_lang  │     │ 💯 score        │     │ ✅ is_active    │
    │ 💯 confidence   │     │ 📅 issued_date  │     │ 🔄 retry_count  │
    │ ⏱️ duration     │     │ 📅 expires_date │     │ 📅 last_called  │
    │ 📅 created_at   │     │ 🔗 issuer       │     │ 📅 created_at   │
    └─────────────────┘     │ 📅 created_at   │     └─────────────────┘
             │              └─────────────────┘              │
             │ Many-to-One           │                       │
             │                       │ Many-to-One           │ Many-to-One
             │                       │                       │
             ▼                       ▼                       ▼
                    ┌─────────────────┐
                    │  USER_SESSIONS  │
                    ├─────────────────┤
                    │ 🔑 id (PK)      │
                    │ 🔗 user_id (FK) │
                    │ 🔑 token        │
                    │ 📱 device_info  │
                    │ 🌐 ip_address   │
                    │ 📍 location     │
                    │ ✅ is_active    │
                    │ 📅 expires_at   │
                    │ 📅 last_activity│
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
- **Projects → Files**: One-to-Many (project can contain multiple files)
- **Projects → Collaborators**: One-to-Many (project can have multiple collaborators)

### 🤝 **Collaboration Relationships**
- **Users → Projects**: One-to-Many (users can own multiple projects)
- **Projects ↔ Users**: Many-to-Many (via collaborators table)
- **Users → Comments**: One-to-Many (users can make multiple comments)
- **Translations → Comments**: One-to-Many (translations can have multiple comments)
- **Files → Comments**: One-to-Many (files can have multiple comments)
- **Comments → Comments**: One-to-Many (nested comments/replies)

### 📊 **Analytics & Monitoring Relationships**
- **Users → Analytics**: One-to-Many (user activity metrics)
- **Users → Notifications**: One-to-Many (user notifications)
- **Users → Voice_Sessions**: One-to-Many (voice translation history)
- **Users → API_Tokens**: One-to-Many (API access tokens)
- **Users → Webhooks**: One-to-Many (webhook configurations)

### 🎓 **Learning & Certification Relationships**
- **Users → Certificates**: One-to-Many (earned certificates)
- **Practice_Sessions → Certificates**: Many-to-One (sessions contribute to certificates)
- **Rajabasha_Papers → Certificates**: Many-to-One (exam completion certificates)

### 📊 **Secondary Relationships**
- **Translations → Translation_History**: One-to-Many (audit trail)
- **Users → Rajabasha_Papers**: One-to-Many (created by relationship)
- **Rajabasha_Papers → Rajabasha_Questions**: One-to-Many
- **Users → User_Sessions**: One-to-Many (authentication sessions)

### 🌐 **Reference Relationships**
- **Languages**: Referenced by Files and Translations (source_language, target_language)
- **Roles**: Define user permissions and access levels

## Entity Descriptions:

### 👤 **Core Entities**

#### **USERS** (Enhanced)
Central entity with additional fields for collaboration and personalization:
- `preferences`: User settings and language preferences
- `skill_level`: Language proficiency tracking
- `last_login`: Security and analytics tracking

#### **FILES** (Enhanced)
Document management with collaboration support:
- `project_id`: Links files to collaborative projects
- `permissions`: Access control for file sharing
- Enhanced metadata for better organization

#### **TRANSLATIONS** (Enhanced)
Advanced translation tracking:
- `ai_suggestions`: AI-powered improvement suggestions
- `processing_time`: Performance metrics
- `cost`: Translation service cost tracking

### 🤝 **Collaboration Entities**

#### **PROJECTS**
Team collaboration workspace:
- Project organization and management
- Progress tracking and deadlines
- Visibility and access control

#### **COLLABORATORS**
Project team management:
- Role-based collaboration (viewer, editor, manager)
- Permission management
- Collaboration history

#### **COMMENTS**
Communication and feedback system:
- Threaded discussions
- File and translation annotations
- Status tracking for feedback resolution

### 📊 **Analytics & Monitoring Entities**

#### **ANALYTICS**
Comprehensive metrics collection:
- User behavior tracking
- System performance monitoring
- Usage pattern analysis
- Custom metric support

#### **NOTIFICATIONS**
Multi-channel communication:
- Email, push, and in-app notifications
- Priority-based delivery
- Read status tracking
- Multiple delivery channels

### 🎤 **Advanced Feature Entities**

#### **VOICE_SESSIONS**
Voice translation capabilities:
- Audio file processing
- Speech-to-text transcription
- Voice translation workflows
- Quality confidence scoring

#### **API_TOKENS**
Developer integration support:
- API access management
- Usage tracking and limits
- Permission scoping
- Security monitoring

#### **WEBHOOKS**
Real-time integration:
- Event-driven notifications
- External system integration
- Retry mechanisms
- Security with secrets

### 🎓 **Learning & Certification Entities**

#### **CERTIFICATES**
Achievement and credentialing:
- Language proficiency certificates
- Course completion tracking
- Skill validation
- Expiration management

#### **PRACTICE_SESSIONS** (Enhanced)
Improved learning tracking:
- `objectives`: Learning goal tracking
- Enhanced difficulty progression
- Better performance analytics

#### **RAJABASHA_PAPERS** (Enhanced)
Government exam system:
- `certificate`: Certification upon completion
- Enhanced metadata
- Better organization

### 🔧 **System Enhancement Entities**

#### **LANGUAGES** (Enhanced)
Better language support:
- `ai_supported`: AI translation capability flags
- Enhanced prioritization
- Better metadata

#### **TRANSLATION_HISTORY** (Enhanced)
Comprehensive audit trail:
- `old_value` / `new_value`: Change tracking
- Enhanced action logging
- Better audit capabilities

#### **SYSTEM_LOGS** (Enhanced)
Advanced monitoring:
- `severity`: Alert level classification
- Enhanced error tracking
- Better security monitoring

#### **USER_SESSIONS** (Enhanced)
Advanced session management:
- `device_info`: Multi-device support
- `location`: Geographic tracking
- `last_activity`: Session management
- Enhanced security features

## 🚀 **New Features Enabled by Enhanced ER Design:**

### 1. 🤝 **Team Collaboration**
- Shared projects and workspaces
- Real-time collaborative editing
- Role-based permissions
- Comment and review systems

### 2. � **Advanced Analytics**
- User behavior tracking
- Performance monitoring
- Usage analytics
- Custom metrics and reporting

### 3. 🔔 **Smart Notifications**
- Multi-channel delivery
- Priority-based alerts
- Read status tracking
- Personalized notifications

### 4. 🎤 **Voice & AI Integration**
- Voice translation sessions
- AI-powered suggestions
- Quality assessment
- Performance optimization

### 5. � **API & Integration Platform**
- Developer API access
- Webhook integrations
- Third-party connectivity
- Usage monitoring

### 6. 🎓 **Learning & Certification**
- Skill assessment
- Progress tracking
- Official certifications
- Personalized learning paths

### 7. 🔒 **Enhanced Security**
- Comprehensive audit trails
- Session management
- API security
- Permission controls
