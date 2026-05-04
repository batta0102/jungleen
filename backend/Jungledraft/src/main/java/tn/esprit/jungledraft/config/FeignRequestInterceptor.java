package tn.esprit.jungledraft.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

@Component
public class FeignRequestInterceptor implements RequestInterceptor {

    private static final String AUTHORIZATION_HEADER = "Authorization";

    @Override
    public void apply(RequestTemplate requestTemplate) {
        String authHeader = resolveAuthorizationHeader();
        if (authHeader != null && !authHeader.isBlank()) {
            requestTemplate.header(AUTHORIZATION_HEADER, authHeader);
        }
    }

    private String resolveAuthorizationHeader() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (!(attributes instanceof ServletRequestAttributes servletRequestAttributes)) {
            return null;
        }

        HttpServletRequest request = servletRequestAttributes.getRequest();
        return request.getHeader(AUTHORIZATION_HEADER);
    }
}
