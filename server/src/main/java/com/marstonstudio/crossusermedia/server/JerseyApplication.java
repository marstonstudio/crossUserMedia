// Copyright (c) 2014. EnglishCentral. All rights reserved.
package com.marstonstudio.crossusermedia.server;

import com.marstonstudio.crossusermedia.server.api.JacksonFeature;
import org.glassfish.hk2.api.ServiceLocator;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;

import javax.inject.Inject;
import javax.ws.rs.ApplicationPath;
import java.util.logging.Level;
import java.util.logging.Logger;

@ApplicationPath("rest")
public class JerseyApplication extends ResourceConfig {

    @Inject
    public JerseyApplication(ServiceLocator serviceLocator) {
        packages("com.marstonstudio.crossusermedia.server.api");

        Logger.getLogger("org.glassfish.jersey").setLevel(Level.INFO);

        register(JacksonFeature.class);
        register(MultiPartFeature.class);
    }
}
