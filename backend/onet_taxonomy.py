"""
O*NET Comprehensive Taxonomy & Reference Knowledge Base
Based on standard O*NET 28.x and Standard Occupational Classification (SOC).
Provides fallback and offline enrichment when live API is unreachable or unconfigured.
"""

ONET_OCCUPATIONS = [
    {
        "soc_code": "15-1252.00",
        "title": "Software Developers",
        "description": "Research, design, and develop computer and network software or specialized utility programs. Analyze user needs and develop software solutions, applying principles and techniques of computer science, engineering, and mathematical analysis. Update software or enhance existing software capabilities.",
        "bright_outlook": True,
        "bright_outlook_category": "Rapid Growth & High Demand",
        "job_zone": 4,
        "job_zone_title": "Considerable Preparation (Bachelor's Degree)",
        "median_annual_salary": "$132,270",
        "sample_titles": [
            "Software Developer", "Full Stack Software Engineer", "Backend Developer",
            "Applications Developer", "Software Architect", "Systems Developer"
        ],
        "core_tasks": [
            "Modify existing software to correct errors, adapt to new hardware, or upgrade interfaces and improve performance.",
            "Develop or direct software system testing or validation procedures and programming.",
            "Direct software programming and development of documentation.",
            "Consult with customers or other departments on project status and technical specifications.",
            "Design, build, or maintain websites, microservices, databases, and APIs using modern software architecture."
        ],
        "knowledge": [
            "Computers and Electronics", "Engineering and Technology", "Mathematics",
            "Design Principles", "Telecommunications"
        ],
        "skills": [
            "Programming", "Systems Analysis", "Complex Problem Solving", "Critical Thinking",
            "Troubleshooting", "Software Design", "Quality Control Analysis"
        ],
        "tools_and_technology": [
            "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
            "React", "Node.js", "Django", "FastAPI", "Spring Boot", "Express.js",
            "Docker", "Kubernetes", "AWS", "Git", "REST APIs", "GraphQL", "PostgreSQL",
            "MongoDB", "Redis", "Microservices", "CI/CD"
        ]
    },
    {
        "soc_code": "15-2051.00",
        "title": "Data Scientists",
        "description": "Develop and implement algorithms, statistical models, and machine learning techniques to discover patterns and extract actionable insights from structured and unstructured data. Build predictive models, data pipelines, and AI systems.",
        "bright_outlook": True,
        "bright_outlook_category": "Rapid Growth (Much Faster than Average)",
        "job_zone": 5,
        "job_zone_title": "Extensive Preparation (Master's or Ph.D. Preferred)",
        "median_annual_salary": "$108,020",
        "sample_titles": [
            "Data Scientist", "Machine Learning Engineer", "AI Scientist",
            "Data Analytics Scientist", "Predictive Modeler", "NLP Engineer"
        ],
        "core_tasks": [
            "Apply machine learning algorithms or statistical techniques to identify hidden data patterns and trends.",
            "Clean, organize, and transform large datasets into actionable formats.",
            "Design and build end-to-end data processing and machine learning pipelines.",
            "Evaluate models using cross-validation, precision, recall, ROC-AUC, and latency benchmarks.",
            "Communicate complex findings and data-driven recommendations to executive leadership via data visualizations."
        ],
        "knowledge": [
            "Mathematics and Statistics", "Computers and Electronics", "Data Mining",
            "Machine Learning", "Information Technology"
        ],
        "skills": [
            "Mathematics", "Critical Thinking", "Programming", "Data Analysis",
            "Statistical Modeling", "Active Learning", "Complex Problem Solving"
        ],
        "tools_and_technology": [
            "Python", "R", "SQL", "PyTorch", "TensorFlow", "Scikit-Learn", "Pandas", "NumPy",
            "Jupyter", "Hugging Face", "LLMs", "Spark", "Hadoop", "Tableau", "Power BI",
            "Databricks", "MLflow", "BigQuery", "Snowflake", "Docker"
        ]
    },
    {
        "soc_code": "15-1254.00",
        "title": "Web Developers",
        "description": "Develop and create websites and web applications. Convert written, graphic, audio, and video components to compatible web formats by using software by which other users can access web content. Analyze user needs to implement web site content, graphics, performance, and capacity.",
        "bright_outlook": True,
        "bright_outlook_category": "Faster than Average Growth",
        "job_zone": 3,
        "job_zone_title": "Medium Preparation (Associate's or Bachelor's Degree)",
        "median_annual_salary": "$92,750",
        "sample_titles": [
            "Frontend Web Developer", "Web Application Developer", "UI Developer",
            "Full Stack Web Developer", "JavaScript Engineer"
        ],
        "core_tasks": [
            "Write, design, or edit web page content, or direct others producing content.",
            "Implement responsive web layouts using modern HTML, CSS, and modern JavaScript frameworks.",
            "Back up website files to local directories for recovery.",
            "Evaluate code to ensure it is valid, meets industry standards, and is compatible with browsers.",
            "Integrate web applications with external REST APIs and backend microservices."
        ],
        "knowledge": [
            "Computers and Electronics", "Design", "Communications and Media",
            "Customer and Personal Service"
        ],
        "skills": [
            "Programming", "Web Standards", "Active Listening", "Critical Thinking",
            "Operations Analysis", "User Experience Optimization"
        ],
        "tools_and_technology": [
            "HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Vue.js", "Angular",
            "Next.js", "Tailwind CSS", "SASS", "Webpack", "Vite", "Git", "REST APIs",
            "Responsive Web Design", "Web Performance Optimization"
        ]
    },
    {
        "soc_code": "15-1299.08",
        "title": "Computer Systems Engineers/Architects (DevOps & Cloud)",
        "description": "Design and develop solutions to complex applications problems, system administration issues, or network concerns. Perform systems management and integration functions. Automate infrastructure deployment, cloud platforms, and continuous integration pipelines.",
        "bright_outlook": True,
        "bright_outlook_category": "Rapid Growth & High Demand",
        "job_zone": 4,
        "job_zone_title": "Considerable Preparation (Bachelor's Degree)",
        "median_annual_salary": "$127,260",
        "sample_titles": [
            "Cloud Architect", "DevOps Engineer", "Site Reliability Engineer (SRE)",
            "Platform Engineer", "Infrastructure Architect", "Systems Engineer"
        ],
        "core_tasks": [
            "Design and deploy scalable, highly available, fault-tolerant infrastructure on cloud providers (AWS, GCP, Azure).",
            "Automate software deployment, testing, and monitoring pipelines using CI/CD tools.",
            "Implement Infrastructure as Code (IaC) utilizing Terraform, Ansible, or CloudFormation.",
            "Monitor system performance, reliability, network bandwidth, and resource utilization.",
            "Manage container orchestration platforms such as Kubernetes, Docker Swarm, or ECS."
        ],
        "knowledge": [
            "Computers and Electronics", "Engineering and Technology", "Telecommunications",
            "Cloud Computing Architectures", "System Security"
        ],
        "skills": [
            "Systems Analysis", "Troubleshooting", "Programming", "Technology Design",
            "Critical Thinking", "Complex Problem Solving"
        ],
        "tools_and_technology": [
            "AWS", "Google Cloud Platform (GCP)", "Microsoft Azure", "Docker", "Kubernetes",
            "Terraform", "Ansible", "CI/CD", "GitHub Actions", "Jenkins", "Linux", "Bash",
            "Prometheus", "Grafana", "Helm", "Kafka", "Python", "Go"
        ]
    },
    {
        "soc_code": "15-1212.00",
        "title": "Information Security Analysts",
        "description": "Plan, implement, upgrade, or monitor security measures for the protection of computer networks and information. Assess system vulnerabilities for security risks and propose and implement security solutions. Respond to computer security incidents and implement defensive mechanisms.",
        "bright_outlook": True,
        "bright_outlook_category": "Much Faster than Average Growth (32%+)",
        "job_zone": 4,
        "job_zone_title": "Considerable Preparation (Bachelor's Degree)",
        "median_annual_salary": "$120,360",
        "sample_titles": [
            "Cybersecurity Analyst", "Information Security Specialist", "Security Engineer",
            "Penetration Tester", "SOC Analyst", "Cloud Security Engineer"
        ],
        "core_tasks": [
            "Monitor computer networks for security issues, anomalies, or intrusions.",
            "Investigate security breaches and other cybersecurity incidents.",
            "Install security software, such as firewalls, SIEM, and data encryption programs.",
            "Conduct penetration testing and vulnerability assessments.",
            "Formulate security standards and best practices for their organization."
        ],
        "knowledge": [
            "Computers and Electronics", "Law and Government", "Public Safety and Security",
            "Information Security Frameworks (NIST, ISO 27001)"
        ],
        "skills": [
            "Systems Evaluation", "Critical Thinking", "Complex Problem Solving", "Active Learning",
            "Incident Response", "Vulnerability Assessment"
        ],
        "tools_and_technology": [
            "SIEM", "Splunk", "Wireshark", "Burp Suite", "Metasploit", "Nessus", "Kali Linux",
            "Python", "Bash", "Snort", "IAM", "OWASP", "Encryption", "Firewalls", "SOC", "Zero Trust"
        ]
    },
    {
        "soc_code": "15-1243.00",
        "title": "Database Architects (Data Engineers)",
        "description": "Design strategies for enterprise database systems and set standards for operations, programming, and security. Design and construct large-scale data warehouses, data lakes, and ETL/ELT pipelines.",
        "bright_outlook": True,
        "bright_outlook_category": "Rapid Growth",
        "job_zone": 4,
        "job_zone_title": "Considerable Preparation (Bachelor's Degree)",
        "median_annual_salary": "$134,870",
        "sample_titles": [
            "Data Engineer", "Database Architect", "Big Data Engineer",
            "Data Warehouse Architect", "Analytics Engineer"
        ],
        "core_tasks": [
            "Design, build, and optimize scalable data pipelines for ETL/ELT from diverse sources.",
            "Develop database architectural strategies at the modeling, design, and implementation stages.",
            "Create and enforce database security, disaster recovery, and data governance standards.",
            "Design schemas, indexing strategies, partitioning, and aggregation pipelines.",
            "Optimize database performance, query latency, and pipeline throughput."
        ],
        "knowledge": [
            "Computers and Electronics", "Engineering and Technology", "Database Design",
            "Data Warehousing", "Distributed Systems"
        ],
        "skills": [
            "Systems Analysis", "Database Architecture", "Programming", "Complex Problem Solving",
            "Performance Optimization"
        ],
        "tools_and_technology": [
            "SQL", "Python", "Apache Spark", "Airflow", "dbt", "Snowflake", "BigQuery",
            "PostgreSQL", "Kafka", "Hadoop", "AWS Redshift", "Databricks", "MongoDB",
            "Cassandra", "Data Modeling", "ETL Pipelines"
        ]
    },
    {
        "soc_code": "15-2051.01",
        "title": "Business Intelligence Analysts",
        "description": "Produce financial and market intelligence by querying data repositories and generating periodic reports. Devise methods for identifying data patterns and trends in available information sources. Create interactive executive dashboards and KPI tracking tools.",
        "bright_outlook": True,
        "bright_outlook_category": "Faster than Average",
        "job_zone": 4,
        "job_zone_title": "Considerable Preparation (Bachelor's Degree)",
        "median_annual_salary": "$103,500",
        "sample_titles": [
            "BI Analyst", "Business Intelligence Developer", "Data Analytics Specialist",
            "Reporting Analyst", "Tableau Developer", "Power BI Specialist"
        ],
        "core_tasks": [
            "Synthesize current business intelligence or trend data to support recommendations for action.",
            "Create interactive reports, data visualizations, and executive dashboards using BI platforms.",
            "Analyze business data and metrics to identify KPIs, anomalies, and operational bottlenecks.",
            "Write complex SQL queries to extract, transform, and aggregate business metrics.",
            "Collaborate with stakeholders to define business metrics and requirements."
        ],
        "knowledge": [
            "Administration and Management", "Computers and Electronics", "Economics and Accounting",
            "Mathematics and Statistics"
        ],
        "skills": [
            "Critical Thinking", "Data Visualization", "Complex Problem Solving", "Active Listening",
            "Systems Evaluation", "Speaking and Presentation"
        ],
        "tools_and_technology": [
            "Power BI", "Tableau", "SQL", "Excel (Advanced / DAX)", "Python", "Looker",
            "BigQuery", "Snowflake", "Google Analytics", "ETL", "KPI Dashboards", "Data Modeling"
        ]
    },
    {
        "soc_code": "15-1255.00",
        "title": "Web and Digital Interface Designers (UI/UX)",
        "description": "Design and create websites and digital interfaces, including overall layout, visual aesthetics, typography, navigation, and user experience. Conduct usability tests and design wireframes, high-fidelity prototypes, and design systems.",
        "bright_outlook": True,
        "bright_outlook_category": "Faster than Average",
        "job_zone": 4,
        "job_zone_title": "Considerable Preparation (Bachelor's Degree)",
        "median_annual_salary": "$98,540",
        "sample_titles": [
            "UI/UX Designer", "Product Designer", "User Experience Researcher",
            "Interaction Designer", "Digital Interface Designer"
        ],
        "core_tasks": [
            "Design digital user interfaces and interaction flows for web and mobile applications.",
            "Develop comprehensive design systems, component libraries, and style guides.",
            "Create low and high-fidelity wireframes, mockups, and interactive prototypes.",
            "Conduct user research, usability testing, and accessibility (WCAG) reviews.",
            "Collaborate with software engineers to ensure pixel-perfect design implementation."
        ],
        "knowledge": [
            "Design", "Computers and Electronics", "Communications and Media",
            "Psychology / Human-Computer Interaction"
        ],
        "skills": [
            "Design Thinking", "User Experience (UX)", "User Interface (UI)", "Active Listening",
            "Visual Communication", "Prototyping"
        ],
        "tools_and_technology": [
            "Figma", "Adobe XD", "Sketch", "InVision", "HTML/CSS", "Wireframing",
            "User Journey Mapping", "Design Systems", "Prototyping", "Usability Testing", "WCAG"
        ]
    },
    {
        "soc_code": "15-1299.09",
        "title": "Information Technology Project Managers (Product / Tech PM)",
        "description": "Plan, initiate, and manage information technology (IT) projects. Lead project teams, define product requirements, manage sprint backlogs, track project milestones, and bridge communication between software engineering teams and business executives.",
        "bright_outlook": True,
        "bright_outlook_category": "High Demand",
        "job_zone": 4,
        "job_zone_title": "Considerable Preparation (Bachelor's Degree)",
        "median_annual_salary": "$102,600",
        "sample_titles": [
            "Technical Product Manager", "IT Project Manager", "Scrum Master",
            "Agile Delivery Lead", "Product Owner", "Program Manager"
        ],
        "core_tasks": [
            "Develop and manage product roadmaps, project scopes, goals, and technical deliverables.",
            "Facilitate agile ceremonies including sprint planning, daily standups, and retrospectives.",
            "Coordinate cross-functional engineering, design, and marketing teams to ensure on-time delivery.",
            "Translate business objectives into clear user stories and technical requirements.",
            "Manage risk, resource allocation, and stakeholder expectations."
        ],
        "knowledge": [
            "Administration and Management", "Computers and Electronics", "Customer Service",
            "Economics and Accounting"
        ],
        "skills": [
            "Project Management", "Agile / Scrum", "Coordination", "Negotiation",
            "Time Management", "Critical Thinking", "Leadership"
        ],
        "tools_and_technology": [
            "Jira", "Confluence", "Asana", "Trello", "Agile / Scrum", "Kanban",
            "PRDs (Product Requirement Documents)", "Roadmapping", "SQL", "Git", "Figma"
        ]
    },
    {
        "soc_code": "15-1242.00",
        "title": "Database Administrators",
        "description": "Administer, test, and implement computer databases, applying knowledge of database management systems. Coordinate changes to computer databases. Identify, configure, and maintain database storage, backups, and disaster recovery.",
        "bright_outlook": True,
        "bright_outlook_category": "Average Growth",
        "job_zone": 4,
        "job_zone_title": "Considerable Preparation (Bachelor's Degree)",
        "median_annual_salary": "$112,120",
        "sample_titles": [
            "Database Administrator (DBA)", "PostgreSQL Administrator", "SQL Server DBA",
            "Data Operations Administrator", "NoSQL Specialist"
        ],
        "core_tasks": [
            "Monitor database performance, capacity, and resource allocation to ensure optimal query execution.",
            "Implement high-availability clustering, failover strategies, and automated backups.",
            "Manage database user permissions, role-based access control, and data encryption.",
            "Perform database upgrades, migrations, patching, and tuning.",
            "Troubleshoot database lockouts, slow queries, and disk I/O bottlenecks."
        ],
        "knowledge": [
            "Computers and Electronics", "Engineering and Technology", "Database Administration",
            "Security and Compliance"
        ],
        "skills": [
            "Systems Analysis", "Troubleshooting", "Database Management", "Critical Thinking",
            "Complex Problem Solving"
        ],
        "tools_and_technology": [
            "PostgreSQL", "MySQL", "Oracle Database", "Microsoft SQL Server", "MongoDB",
            "Redis", "Linux", "Bash", "Python", "Database Clustering", "Backup and Recovery"
        ]
    },
    {
        "soc_code": "15-1253.00",
        "title": "Software Quality Assurance Analysts and Testers",
        "description": "Develop and execute software test plans in order to identify software problems and their causes. Participate in product design reviews to provide input on functional requirements, product designs, schedules, or potential problems. Create automated test suites.",
        "bright_outlook": True,
        "bright_outlook_category": "Rapid Growth",
        "job_zone": 4,
        "job_zone_title": "Considerable Preparation (Bachelor's Degree)",
        "median_annual_salary": "$101,800",
        "sample_titles": [
            "QA Engineer", "Software Development Engineer in Test (SDET)",
            "Test Automation Engineer", "Quality Assurance Lead", "Performance Tester"
        ],
        "core_tasks": [
            "Design, write, and execute automated test suites (unit, integration, end-to-end, regression).",
            "Document software defects using a bug tracking system and report defects to software developers.",
            "Conduct load, stress, and performance testing on web applications and APIs.",
            "Participate in sprint design reviews to identify edge cases and verification strategies.",
            "Integrate automated test execution into CI/CD build pipelines."
        ],
        "knowledge": [
            "Computers and Electronics", "Engineering and Technology", "Quality Assurance Methodologies"
        ],
        "skills": [
            "Programming", "Quality Control Analysis", "Critical Thinking", "Troubleshooting",
            "Systems Evaluation"
        ],
        "tools_and_technology": [
            "Selenium", "Cypress", "Playwright", "Jest", "JUnit", "Postman", "PyTest",
            "Jira", "Git", "CI/CD", "Python", "JavaScript", "SQL", "LoadRunner", "JMeter"
        ]
    },
    {
        "soc_code": "15-1211.00",
        "title": "Computer Systems Analysts",
        "description": "Analyze science, engineering, business, and other data processing problems to implement and improve computer systems. Analyze user requirements, procedures, and problems to automate or improve existing systems and review computer system capabilities, workflow, and scheduling limitations.",
        "bright_outlook": True,
        "bright_outlook_category": "Average Growth",
        "job_zone": 4,
        "job_zone_title": "Considerable Preparation (Bachelor's Degree)",
        "median_annual_salary": "$103,800",
        "sample_titles": [
            "Systems Analyst", "Business Systems Analyst", "Technical Business Analyst",
            "IT Systems Consultant", "Solutions Analyst"
        ],
        "core_tasks": [
            "Consult with managers to determine the role of IT systems in an organization.",
            "Research emerging technologies to decide if installing them can increase an organization's efficiency.",
            "Prepare cost-benefit analyses for IT infrastructure and software upgrades.",
            "Design ways to add functionality to existing computer systems.",
            "Oversee the installation and configuration of new systems to customize them for the organization."
        ],
        "knowledge": [
            "Computers and Electronics", "Customer and Personal Service", "Engineering and Technology",
            "Administration and Management"
        ],
        "skills": [
            "Systems Analysis", "Critical Thinking", "Complex Problem Solving", "Active Listening",
            "Operations Analysis"
        ],
        "tools_and_technology": [
            "SQL", "UML", "Jira", "Visio", "BPMN", "Python", "Excel", "ER Diagrams",
            "Agile", "Business Process Modeling", "API Integration"
        ]
    },
    {
        "soc_code": "11-3021.00",
        "title": "Computer and Information Systems Managers",
        "description": "Plan, direct, or coordinate activities in such fields as electronic data processing, information systems, systems analysis, and computer programming. Supervise engineering teams, allocate IT budgets, and define technological vision.",
        "bright_outlook": True,
        "bright_outlook_category": "Much Faster than Average Growth",
        "job_zone": 5,
        "job_zone_title": "Extensive Preparation (Bachelor's or Master's + 5+ Years Experience)",
        "median_annual_salary": "$169,510",
        "sample_titles": [
            "Engineering Manager", "Director of Software Engineering", "Chief Technology Officer (CTO)",
            "IT Director", "Head of Product Engineering", "VP of Engineering"
        ],
        "core_tasks": [
            "Direct the work of computer and IT personnel, providing mentorship and architectural guidance.",
            "Formulate strategic goals and implement plans to achieve target tech milestones.",
            "Manage department budgets, vendor contracts, and hardware/software procurement.",
            "Ensure security of information technology networks, compliance, and disaster recovery.",
            "Recruit, interview, and hire high-performing software engineering teams."
        ],
        "knowledge": [
            "Administration and Management", "Computers and Electronics", "Personnel and HR",
            "Economics and Accounting"
        ],
        "skills": [
            "Management of Personnel Resources", "Decision Making", "Critical Thinking",
            "Complex Problem Solving", "Systems Evaluation", "Leadership"
        ],
        "tools_and_technology": [
            "Engineering Management", "Agile Leadership", "System Architecture", "Cloud Strategy",
            "Jira", "Budgeting", "Roadmapping", "Talent Acquisition", "Risk Management"
        ]
    },
    {
        "soc_code": "15-1244.00",
        "title": "Network and Computer Systems Administrators",
        "description": "Install, configure, and maintain an organization's local area network (LAN), wide area network (WAN), data communications network, operating systems, and physical and virtual servers.",
        "bright_outlook": False,
        "bright_outlook_category": "Stable Demand",
        "job_zone": 3,
        "job_zone_title": "Medium to Considerable Preparation",
        "median_annual_salary": "$95,360",
        "sample_titles": [
            "Systems Administrator (SysAdmin)", "Network Administrator", "Linux Administrator",
            "Infrastructure Support Specialist", "Server Administrator"
        ],
        "core_tasks": [
            "Maintain network hardware and software, including routers, switches, and firewalls.",
            "Analyze and resolve network performance and connectivity problems.",
            "Perform regular system backups and disaster recovery protocols.",
            "Configure user accounts, access permissions, and Active Directory policies.",
            "Apply patches, software updates, and security fixes to server infrastructure."
        ],
        "knowledge": [
            "Computers and Electronics", "Telecommunications", "Customer Service",
            "System Administration"
        ],
        "skills": [
            "Troubleshooting", "Active Listening", "Operations Monitoring", "Systems Analysis",
            "Critical Thinking"
        ],
        "tools_and_technology": [
            "Linux (Ubuntu/RHEL)", "Windows Server", "Active Directory", "Bash", "PowerShell",
            "TCP/IP", "DNS", "DHCP", "VPN", "VMware", "Cisco IOS", "Wireshark"
        ]
    }
]


def get_all_soc_codes():
    """Return list of all indexed SOC codes."""
    return [occ["soc_code"] for occ in ONET_OCCUPATIONS]


def get_occupation_by_code(code: str):
    """Retrieve detailed occupation dictionary by exact or prefix SOC code."""
    clean_code = code.strip()
    for occ in ONET_OCCUPATIONS:
        if occ["soc_code"] == clean_code or occ["soc_code"].startswith(clean_code):
            return occ
    return None


def search_local_occupations(query: str, limit: int = 10):
    """Search occupations by keyword, title, or technology."""
    q_lower = query.lower().strip()
    results = []
    
    for occ in ONET_OCCUPATIONS:
        score = 0
        title_lower = occ["title"].lower()
        desc_lower = occ["description"].lower()
        
        # Check title match
        if q_lower in title_lower:
            score += 50
        elif any(word in title_lower for word in q_lower.split()):
            score += 25
            
        # Check sample titles
        for st in occ.get("sample_titles", []):
            if q_lower in st.lower():
                score += 35
                break
                
        # Check tools & tech
        for tool in occ.get("tools_and_technology", []):
            if q_lower == tool.lower():
                score += 30
            elif q_lower in tool.lower():
                score += 15
                
        # Check skills
        for skill in occ.get("skills", []):
            if q_lower in skill.lower():
                score += 15
                
        if score > 0 or q_lower in desc_lower:
            results.append((score, occ))
            
    # Sort by relevance score descending
    results.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in results[:limit]]
