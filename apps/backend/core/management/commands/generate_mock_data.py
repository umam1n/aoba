import random
from datetime import datetime, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from companies.models import Company, CompanyMembership
from employees.models import Employee, RoleHistory, CompensationHistory
from analytics.models import RiskScore, AnomalyFlag

User = get_user_model()

DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Product', 'HR']
FIRST_NAMES = ['John', 'Jane', 'Alex', 'Emily', 'Chris', 'Katie', 'Mike', 'Sarah', 'David', 'Laura', 'Robert', 'Emma']
LAST_NAMES = ['Smith', 'Doe', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez']
TITLES = ['Software Engineer', 'Account Executive', 'Product Manager', 'HR Business Partner', 'Marketing Coordinator']
LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5']

class Command(BaseCommand):
    help = 'Generates mock data for local development'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting mock data generation...")

        # 1. Company
        company, created = Company.objects.get_or_create(
            name="Acme Corp",
            defaults={'industry': 'Technology', 'employee_count_tier': '100-250', 'subscription_status': 'active'}
        )
        self.stdout.write(f"Company: {company.name}")

        # 2. User & Membership
        admin_email = 'admin@acmecorp.com'
        user, created = User.objects.get_or_create(
            username=admin_email,
            defaults={'email': admin_email, 'is_staff': True, 'is_superuser': True}
        )
        if created:
            user.set_password('password123')
            user.save()
            
        CompanyMembership.objects.get_or_create(
            company=company, user=user, defaults={'role': 'hr_admin'}
        )
        self.stdout.write(f"Admin User: {user.email}")

        # 3. Employees
        if Employee.objects.filter(company=company).count() < 100:
            self.stdout.write("Generating 100+ employees...")
            employees = []
            now = timezone.now().date()
            for i in range(1, 121):
                department = random.choice(DEPARTMENTS)
                title = random.choice(TITLES)
                level = random.choice(LEVELS)
                salary = Decimal(random.randint(60000, 180000))
                hire_date = now - timedelta(days=random.randint(100, 2000))
                
                emp = Employee.objects.create(
                    company=company,
                    employee_code=f"EMP-{i:04d}",
                    full_name=f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
                    email=f"emp{i}@acmecorp.com",
                    department=department,
                    role_title=title,
                    role_level=level,
                    hire_date=hire_date,
                    current_salary=salary,
                )
                employees.append(emp)
                
                # History
                RoleHistory.objects.create(
                    employee=emp, company=company, role_title=title, role_level=level, 
                    effective_date=hire_date, change_type='hire'
                )
                CompensationHistory.objects.create(
                    employee=emp, company=company, salary=salary, 
                    effective_date=hire_date, change_reason='hire'
                )

                # Risk Score (randomly generate some at risk)
                score = random.randint(10, 95)
                tier = 'low' if score < 40 else 'medium' if score < 70 else 'high' if score < 90 else 'critical'
                RiskScore.objects.create(
                    employee=emp, company=company, overall_score=score, risk_tier=tier,
                    component_scores={'tenure_risk': 20, 'compensation_ratio': 10},
                    top_factors=['tenure_risk', 'compensation_ratio'], model_version='mock_v1'
                )

            # Assign Managers
            for emp in employees[10:]:
                emp.manager = random.choice(employees[:10])
                emp.save()

        # 4. Anomalies
        if not AnomalyFlag.objects.filter(company=company).exists():
            self.stdout.write("Generating anomalies...")
            AnomalyFlag.objects.create(
                company=company, anomaly_type='team_attrition', severity='critical',
                entity_type='team', entity_id='eng-team-alpha', entity_name='Engineering Alpha',
                description={'text': 'High attrition rate detected in Engineering Alpha'},
                metric_value=25.5, threshold_value=15.0
            )
            AnomalyFlag.objects.create(
                company=company, anomaly_type='compensation_gap', severity='warning',
                entity_type='department', entity_id='dept-sales', entity_name='Sales',
                description={'text': 'Compensation below market median for Sales dept'},
                metric_value=0.85, threshold_value=0.90
            )

        self.stdout.write(self.style.SUCCESS('Successfully generated mock data!'))
