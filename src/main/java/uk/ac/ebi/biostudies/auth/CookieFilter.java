package uk.ac.ebi.biostudies.auth;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.context.support.SpringBeanAutowiringSupport;
import uk.ac.ebi.biostudies.api.util.CookieMap;
import uk.ac.ebi.biostudies.api.util.HttpTools;
import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Created by ehsan on 15/03/2017.
 */
public class CookieFilter implements Filter {

    private Logger logger = LogManager.getLogger(CookieFilter.class.getName());


    @Autowired
    UserSecurityService users;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {

    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse response, FilterChain filterChain) throws IOException, ServletException {
        SpringBeanAutowiringSupport.processInjectionBasedOnCurrentContext(this);
        try {
            CookieMap cookies = new CookieMap(((HttpServletRequest) servletRequest).getCookies());
            String userName = cookies.getCookieValue(HttpTools.AE_USERNAME_COOKIE);
//            if (null != userName) { // Commenting this to enable + sign in username
//                userName = URLDecoder.decode(userName, "UTF-8");
//            }
            //TODO: token is hashed password for now. Check if it should be replaced
            String token = cookies.getCookieValue(HttpTools.AE_TOKEN_COOKIE);
            User user = users.checkAccess(userName, token);
            if (user != null)
                Session.setCurrentUser(user);
            else
                Session.clear();
        } catch (Throwable x) {
            logger.error("problem happend in security filter");
        }
        if(response instanceof HttpServletResponse)
            ((HttpServletResponse)response).setHeader("Cache-Control","no-cache");
        filterChain.doFilter(servletRequest, response);
    }

    @Override
    public void destroy() {

    }
}
