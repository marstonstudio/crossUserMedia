package com.marstonstudio.crossUserServer;

import com.marstonstudio.crossUserServer.util.FileUtil;
import org.apache.log4j.Logger;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.annotation.WebListener;

@WebListener
public class Bootstrap implements ServletContextListener {

    private static Logger logger = Logger.getLogger(Bootstrap.class);

    @Override
    public void contextInitialized(ServletContextEvent servletContextEvent) {
        logger.info("Starting Recorder");

        FileUtil.startup(servletContextEvent.getServletContext());

    }

    @Override
    public void contextDestroyed(ServletContextEvent servletContextEvent) {
        logger.info("Stopping Recorder");
    }
}
