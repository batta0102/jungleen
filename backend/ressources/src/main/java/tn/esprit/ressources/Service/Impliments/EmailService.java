package tn.esprit.ressources.Service.Impliments;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendTrackingNumber(String to, String trackingNumber) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Your Delivery Tracking Number");
        message.setText("Dear Customer,\n\nYour order has been shipped.\nTracking Number: "
                + trackingNumber + "\n\nYou can use this number to track your delivery.\n\nBest regards,\nYour Company");
        mailSender.send(message);
    }
}

