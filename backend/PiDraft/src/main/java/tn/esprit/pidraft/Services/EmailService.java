package tn.esprit.pidraft.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendInterviewEmail(
            String toEmail,
            String applicantName,
            String jobTitle,
            String interviewDate,
            String interviewType,
            String meetLink
    ) {
        System.out.println("📧 EmailService.sendInterviewEmail() called");
        System.out.println("📧 To: " + toEmail);
        System.out.println("📧 Applicant: " + applicantName);
        System.out.println("📧 Job: " + jobTitle);
        System.out.println("📧 Date: " + interviewDate);
        System.out.println("📧 Type: " + interviewType);
        System.out.println("📧 Meet Link: " + meetLink);
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Interview Scheduled - " + jobTitle);

            String htmlContent = buildInterviewEmailHtml(applicantName, jobTitle, interviewDate, interviewType, meetLink);
            helper.setText(htmlContent, true);

            System.out.println("📧 Sending email to: " + toEmail);
            mailSender.send(message);
            System.out.println("✅ Email sent to: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Failed to send email to " + toEmail + ": " + e.getMessage());
            e.printStackTrace();
            // Don't throw - just log the error so interview creation doesn't fail
        }
    }

    private String buildInterviewEmailHtml(
            String applicantName,
            String jobTitle,
            String interviewDate,
            String interviewType,
            String meetLink
    ) {
        StringBuilder html = new StringBuilder();
        
        html.append("<!DOCTYPE html>");
        html.append("<html><head><meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; }");
        html.append(".container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }");
        html.append(".header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; text-align: center; }");
        html.append(".header h1 { margin: 0; font-size: 28px; font-weight: 600; }");
        html.append(".content { padding: 40px 30px; }");
        html.append(".info-box { background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }");
        html.append(".info-item { margin: 10px 0; font-size: 16px; }");
        html.append(".info-label { font-weight: 600; color: #495057; display: inline-block; min-width: 120px; }");
        html.append(".info-value { color: #212529; }");
        html.append(".meet-button { display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: background-color 0.3s; }");
        html.append(".meet-button:hover { background-color: #218838; }");
        html.append(".footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }");
        html.append(".good-luck { background-color: #e7f5ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 15px; margin-top: 20px; text-align: center; }");
        html.append(".good-luck p { margin: 0; color: #004085; font-weight: 500; }");
        html.append("</style></head><body>");
        
        html.append("<div class='container'>");
        html.append("<div class='header'>");
        html.append("<h1>🎯 Interview Scheduled</h1>");
        html.append("</div>");
        
        html.append("<div class='content'>");
        html.append("<p style='font-size: 18px; margin-bottom: 20px;'>Dear <strong>").append(applicantName).append("</strong>,</p>");
        html.append("<p style='font-size: 16px; color: #495057; margin-bottom: 30px;'>Your interview has been scheduled successfully! Here are the details:</p>");
        
        html.append("<div class='info-box'>");
        html.append("<div class='info-item'><span class='info-label'>📅 Date:</span> <span class='info-value'>").append(interviewDate).append("</span></div>");
        html.append("<div class='info-item'><span class='info-label'>🏢 Type:</span> <span class='info-value'>").append(interviewType).append("</span></div>");
        html.append("<div class='info-item'><span class='info-label'>💼 Position:</span> <span class='info-value'>").append(jobTitle).append("</span></div>");
        html.append("</div>");
        
        if (meetLink != null && !meetLink.isEmpty() && interviewType.equals("EN_LIGNE")) {
            html.append("<div style='text-align: center; margin: 20px 0;'>");
            html.append("<a href='").append(meetLink).append("' target='_blank' class='meet-button'>🎥 Join Google Meet</a>");
            html.append("</div>");
        }
        
        html.append("<div class='good-luck'>");
        html.append("<p>🌟 Good luck with your interview! We look forward to speaking with you.</p>");
        html.append("</div>");
        
        html.append("</div>");
        
        html.append("<div class='footer'>");
        html.append("<p>This is an automated message. Please do not reply to this email.</p>");
        html.append("<p>© 2024 Career Center. All rights reserved.</p>");
        html.append("</div>");
        
        html.append("</div>");
        html.append("</body></html>");
        
        return html.toString();
    }

    /**
     * Send a certificate email with the beautiful HTML certificate as the email body.
     */
    public void sendCertificateEmail(
            String toEmail,
            String userName,
            String certificateNumber,
            String certificateHtml
    ) {
        System.out.println("📧 EmailService.sendCertificateEmail() called");
        System.out.println("📧 To: " + toEmail);
        System.out.println("📧 User: " + userName);
        System.out.println("📧 Certificate: " + certificateNumber);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("🏆 Congratulations! Your Jungle in English Certificate - " + certificateNumber);
            helper.setText(certificateHtml, true);

            System.out.println("📧 Sending certificate email to: " + toEmail);
            mailSender.send(message);
            System.out.println("✅ Certificate email sent to: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Failed to send certificate email to " + toEmail + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send certificate email", e);
        }
    }
}
