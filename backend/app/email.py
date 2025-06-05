import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Environment, FileSystemLoader
from typing import List, Optional
import os
from .config import settings

# Initialize Jinja2 environment for email templates
template_env = Environment(
    loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), "email_templates"))
)

class EmailService:
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL
        self.from_name = settings.FROM_NAME

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send an email using SMTP"""
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email

            # Add text part if provided
            if text_content:
                text_part = MIMEText(text_content, "plain")
                message.attach(text_part)

            # Add HTML part
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)

            # Send email
            await aiosmtplib.send(
                message,
                hostname=self.smtp_server,
                port=self.smtp_port,
                username=self.smtp_username,
                password=self.smtp_password,
                use_tls=True,
            )
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

    async def send_booking_confirmation(
        self,
        to_email: str,
        customer_name: str,
        booking_data: dict
    ) -> bool:
        """Send booking confirmation email"""
        template = template_env.get_template("booking_confirmation.html")
        
        html_content = template.render(
            customer_name=customer_name,
            booking=booking_data,
            app_name="StayHub"
        )
        
        subject = f"Booking Confirmation - {booking_data['listing_title']}"
        
        return await self.send_email(to_email, subject, html_content)

    async def send_booking_status_update(
        self,
        to_email: str,
        customer_name: str,
        booking_data: dict,
        status: str
    ) -> bool:
        """Send booking status update email"""
        template = template_env.get_template("booking_status_update.html")
        
        html_content = template.render(
            customer_name=customer_name,
            booking=booking_data,
            status=status,
            app_name="StayHub"
        )
        
        subject = f"Booking {status.title()} - {booking_data['listing_title']}"
        
        return await self.send_email(to_email, subject, html_content)

    async def send_new_booking_notification(
        self,
        to_email: str,
        host_name: str,
        booking_data: dict
    ) -> bool:
        """Send new booking notification to host"""
        template = template_env.get_template("new_booking_notification.html")
        
        html_content = template.render(
            host_name=host_name,
            booking=booking_data,
            app_name="StayHub"
        )
        
        subject = f"New Booking Request - {booking_data['listing_title']}"
        
        return await self.send_email(to_email, subject, html_content)

    async def send_review_notification(
        self,
        to_email: str,
        host_name: str,
        review_data: dict
    ) -> bool:
        """Send review notification to host"""
        template = template_env.get_template("review_notification.html")
        
        html_content = template.render(
            host_name=host_name,
            review=review_data,
            app_name="StayHub"
        )
        
        subject = f"New Review - {review_data['listing_title']}"
        
        return await self.send_email(to_email, subject, html_content)

# Global email service instance
email_service = EmailService() 