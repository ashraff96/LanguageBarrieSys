# DocuTranslate Use Case Diagram

## Use Case Diagram - System Overview

```
                    🌐 DocuTranslate System Boundary
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                                                                         │
    │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
    │  │ 🔐 Authentication│    │ 📄 File Mgmt    │    │ 🔤 Translation  │     │
    │  │ ════════════════ │    │ ════════════════ │    │ ════════════════ │     │
    │  │ • Login          │    │ • Upload Files  │    │ • Translate Doc │     │
    │  │ • Register       │    │ • View Files    │    │ • Translate Text│     │
    │  │ • Logout         │    │ • Download Files│    │ • View History  │     │
    │  │ • Reset Password │    │ • Delete Files  │    │ • Edit Trans.   │     │
    │  │ • Update Profile │    │ • File Preview  │    │ • Rate Quality  │     │
    │  └─────────────────┘    └─────────────────┘    └─────────────────┘     │
    │           │                       │                       │            │
    │           │                       │                       │            │
    │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
    │  │ 📊 Dashboard    │    │ 👨‍💼 Admin Features│    │ 🎯 Practice     │     │
    │  │ ════════════════ │    │ ════════════════ │    │ ════════════════ │     │
    │  │ • View Stats    │    │ • Manage Users  │    │ • Practice Lang │     │
    │  │ • Recent Activity│    │ • View All Trans│    │ • Take Tests    │     │
    │  │ • File Status   │    │ • System Logs   │    │ • Vocabulary    │     │
    │  │ • Usage Analytics│    │ • DB Management │    │ • Progress Track│     │
    │  └─────────────────┘    │ • System Config │    └─────────────────┘     │
    │           │              │ • User Reports  │             │              │
    │           │              └─────────────────┘             │              │
    │           │                       │                      │              │
    │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
    │  │ 🔔 Notifications│    │ 📝 Rajabasha    │    │ 🎤 Voice (Future)│     │
    │  │ ════════════════ │    │ ════════════════ │    │ ════════════════ │     │
    │  │ • System Alerts │    │ • Exam Papers   │    │ • Voice to Text │     │
    │  │ • Email Notify  │    │ • Questions     │    │ • Text to Voice │     │
    │  │ • Status Updates│    │ • Practice Tests│    │ • Voice Trans.  │     │
    │  └─────────────────┘    │ • Results       │    └─────────────────┘     │
    │                         └─────────────────┘                            │
    └─────────────────────────────────────────────────────────────────────────┘

👤 Regular User             👨‍💼 Admin User              🤖 System               🌐 External API
══════════════               ══════════════              ══════════               ═══════════════
    │                             │                         │                         │
    │ ┌─────────────────────┐     │ ┌─────────────────────┐ │ ┌─────────────────┐     │ ┌─────────────────┐
    ├─│ Authentication      │     ├─│ All User Features   │ ├─│ Auto Backup     │     ├─│ Translation API │
    │ │ • Login/Register    │     │ │ + Admin Rights      │ │ │ • Scheduled     │     │ │ • Google Trans  │
    │ │ • Profile Mgmt      │     │ └─────────────────────┘ │ │ • On Demand     │     │ │ • Azure Trans   │
    │ └─────────────────────┘     │                         │ └─────────────────┘     │ │ • AWS Trans     │
    │                             │ ┌─────────────────────┐ │                         │ └─────────────────┘
    │ ┌─────────────────────┐     ├─│ User Management     │ │ ┌─────────────────┐     │
    ├─│ File Operations     │     │ │ • Create Users      │ ├─│ File Processing │     │ ┌─────────────────┐
    │ │ • Upload Documents  │     │ │ • Update Users      │ │ │ • Text Extract  │     ├─│ Email Service   │
    │ │ • View File List    │     │ │ • Delete Users      │ │ │ • Format Detect │     │ │ • SMTP          │
    │ │ • Download Files    │     │ │ • Assign Roles      │ │ │ • Validation    │     │ │ • Notifications │
    │ │ • Preview Content   │     │ └─────────────────────┘ │ └─────────────────┘     │ └─────────────────┘
    │ └─────────────────────┘     │                         │                         │
    │                             │ ┌─────────────────────┐ │ ┌─────────────────┐     │ ┌─────────────────┐
    │ ┌─────────────────────┐     ├─│ System Management   │ ├─│ Monitoring      │     ├─│ Cloud Storage   │
    ├─│ Translation         │     │ │ • View Statistics   │ │ │ • Performance   │     │ │ • AWS S3        │
    │ │ • Document Trans    │     │ │ • Database Mgmt     │ │ │ • Error Logging │     │ │ • Azure Blob    │
    │ │ • Text Translation  │     │ │ • System Logs       │ │ │ • Health Check  │     │ │ • Google Cloud  │
    │ │ • History View      │     │ │ • Configuration     │ │ └─────────────────┘     │ └─────────────────┘
    │ │ • Quality Rating    │     │ └─────────────────────┘ │                         │
    │ └─────────────────────┘     │                         │ ┌─────────────────┐     │
    │                             │ ┌─────────────────────┐ ├─│ Security        │     │
    │ ┌─────────────────────┐     ├─│ Content Management  │ │ │ • Auth Tokens   │     │
    ├─│ Dashboard           │     │ │ • Manage Languages  │ │ │ • Rate Limiting │     │
    │ │ • Personal Stats    │     │ │ • Translation Mgmt  │ │ │ • Data Encrypt  │     │
    │ │ • Recent Activity   │     │ │ • File Management   │ │ └─────────────────┘     │
    │ │ • Usage Trends      │     │ │ • Practice Content  │ │                         │
    │ └─────────────────────┘     │ └─────────────────────┘ │                         │
    │                             │                         │                         │
    │ ┌─────────────────────┐     │                         │                         │
    ├─│ Practice & Learning │     │                         │                         │
    │ │ • Language Practice │     │                         │                         │
    │ │ • Vocabulary Tests  │     │                         │                         │
    │ │ • Rajabasha Exams   │     │                         │                         │
    │ │ • Progress Tracking │     │                         │                         │
    │ └─────────────────────┘     │                         │                         │
    │                             │                         │                         │
```

## Detailed Use Case Descriptions:

### 👤 **REGULAR USER USE CASES**

#### 🔐 **Authentication**
- **UC-001**: User Registration
- **UC-002**: User Login  
- **UC-003**: Password Reset
- **UC-004**: Profile Update
- **UC-005**: Logout

#### 📄 **File Management**
- **UC-006**: Upload Document
- **UC-007**: View Uploaded Files
- **UC-008**: Download File
- **UC-009**: Delete File
- **UC-010**: Preview File Content

#### 🔤 **Translation Services**
- **UC-011**: Translate Document
- **UC-012**: Direct Text Translation
- **UC-013**: View Translation History
- **UC-014**: Edit Translation
- **UC-015**: Rate Translation Quality
- **UC-016**: Download Translation

#### 📊 **Dashboard & Analytics**
- **UC-017**: View Personal Dashboard
- **UC-018**: View Translation Statistics
- **UC-019**: View File Status
- **UC-020**: View Recent Activity

#### 🎯 **Practice & Learning**
- **UC-021**: Start Practice Session
- **UC-022**: Take Vocabulary Test
- **UC-023**: View Progress Reports
- **UC-024**: Take Rajabasha Exam

### 👨‍💼 **ADMIN USER USE CASES**

#### 👥 **User Management**
- **UC-025**: View All Users
- **UC-026**: Create New User
- **UC-027**: Update User Details
- **UC-028**: Delete User
- **UC-029**: Assign User Roles
- **UC-030**: Manage User Status

#### 🔤 **Translation Management**
- **UC-031**: View All Translations
- **UC-032**: Monitor Translation Status
- **UC-033**: View Translation Analytics
- **UC-034**: Manage Translation Quality

#### 🗄️ **System Management**
- **UC-035**: View System Dashboard
- **UC-036**: Database Management
- **UC-037**: View System Logs
- **UC-038**: System Configuration
- **UC-039**: Performance Monitoring

#### 📝 **Content Management**
- **UC-040**: Manage Languages
- **UC-041**: Manage Rajabasha Content
- **UC-042**: File System Management
- **UC-043**: Backup Management

### 🤖 **SYSTEM USE CASES**

#### ⚙️ **Automated Processes**
- **UC-044**: Scheduled Backup
- **UC-045**: File Processing
- **UC-046**: Performance Monitoring
- **UC-047**: Error Logging
- **UC-048**: Security Monitoring

#### 📧 **Notifications**
- **UC-049**: Send Email Notifications
- **UC-050**: System Alerts
- **UC-051**: Status Updates

### 🌐 **EXTERNAL API USE CASES**

#### 🔤 **Translation APIs**
- **UC-052**: Google Translate Integration
- **UC-053**: Azure Translation Service
- **UC-054**: AWS Translation Service

#### ☁️ **Cloud Services**
- **UC-055**: Cloud File Storage
- **UC-056**: Email Service Integration
- **UC-057**: Authentication Services

## Use Case Relationships:

### 📊 **Include Relationships**
- Login ← Authentication Required (for all user operations)
- File Upload ← User Authentication
- Translation ← File Upload (for document translation)

### 🔄 **Extend Relationships**
- Advanced Search ← View Files
- Batch Translation ← Document Translation
- API Integration ← Translation Services

### 👨‍💼 **Inheritance Relationships**
- Admin inherits all Regular User capabilities
- Translator inherits Regular User + advanced translation features
