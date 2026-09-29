import type {
  OAuth2Client,
  OAuth2DomainInfo,
  OAuth2Template,
} from '#/api/tb/oauth2';

export type ClientFormValues = Pick<
  OAuth2Client,
  'additionalInfo' | 'clientId' | 'clientSecret' | 'platforms' | 'title'
>;

export type ClientGeneralFormValues = Pick<
  OAuth2Client,
  | 'accessTokenUri'
  | 'authorizationUri'
  | 'clientAuthenticationMethod'
  | 'jwkSetUri'
  | 'loginButtonIcon'
  | 'loginButtonLabel'
  | 'scope'
  | 'userInfoUri'
> &
  Pick<OAuth2Client['mapperConfig'], 'activateUser' | 'allowUserCreation'>;

export type ClientMapperFormValues = Pick<
  OAuth2Client,
  'userNameAttributeName'
> & {
  mapperConfig: Pick<OAuth2Client['mapperConfig'], 'basic' | 'custom' | 'type'>;
};

export function toClientFormValues(client: OAuth2Client): {
  basic: ClientFormValues;
  general: ClientGeneralFormValues;
  mapper: ClientMapperFormValues;
} {
  return {
    basic: {
      title: client.title,
      additionalInfo: client.additionalInfo,
      platforms: client.platforms,
      clientId: client.clientId,
      clientSecret: client.clientSecret,
    },
    general: {
      accessTokenUri: client.accessTokenUri,
      authorizationUri: client.authorizationUri,
      jwkSetUri: client.jwkSetUri,
      userInfoUri: client.userInfoUri,
      clientAuthenticationMethod: client.clientAuthenticationMethod,
      loginButtonLabel: client.loginButtonLabel,
      loginButtonIcon: client.loginButtonIcon,
      allowUserCreation: client.mapperConfig.allowUserCreation,
      activateUser: client.mapperConfig.activateUser,
      scope: client.scope,
    },
    mapper: {
      userNameAttributeName: client.userNameAttributeName,
      mapperConfig: {
        type: client.mapperConfig.type,
        basic: client.mapperConfig.basic,
        custom: client.mapperConfig.custom,
      },
    },
  };
}

export function createDefaultClient(): OAuth2Client {
  return {
    title: '',
    additionalInfo: { providerName: 'Custom' },
    clientId: '',
    clientSecret: '',
    authorizationUri: '',
    accessTokenUri: '',
    scope: [],
    platforms: [],
    userInfoUri: '',
    jwkSetUri: '',
    clientAuthenticationMethod: 'POST',
    userNameAttributeName: 'email',
    loginButtonLabel: '',
    loginButtonIcon: '',
    mapperConfig: {
      type: 'BASIC',
      allowUserCreation: true,
      activateUser: false,
      basic: {
        emailAttributeKey: 'email',
        firstNameAttributeKey: '',
        lastNameAttributeKey: '',
        tenantNameStrategy: 'DOMAIN',
        tenantNamePattern: '',
        customerNamePattern: '',
        defaultDashboardName: '',
        alwaysFullScreen: false,
      },
      custom: { url: '', username: '', password: '', sendToken: false },
    },
  };
}

/** Only registration fields belong in a client; template IDs are unrelated entity IDs. */
export function applyClientTemplate(
  current: OAuth2Client,
  template?: OAuth2Template,
): OAuth2Client {
  const defaults = createDefaultClient();
  const registration = template
    ? {
        accessTokenUri: template.accessTokenUri,
        authorizationUri: template.authorizationUri,
        scope: [...(template.scope ?? [])],
        userInfoUri: template.userInfoUri,
        jwkSetUri: template.jwkSetUri,
        clientAuthenticationMethod: template.clientAuthenticationMethod,
        userNameAttributeName: template.userNameAttributeName,
        loginButtonLabel: template.loginButtonLabel,
        loginButtonIcon: template.loginButtonIcon,
        mapperConfig: JSON.parse(
          JSON.stringify(template.mapperConfig),
        ) as OAuth2Client['mapperConfig'],
      }
    : {};
  return {
    ...current,
    ...defaults,
    ...registration,
    title: current.title,
    platforms: current.platforms,
    additionalInfo: {
      ...current.additionalInfo,
      providerName: template?.name ?? 'Custom',
    },
    mapperConfig: {
      ...defaults.mapperConfig,
      ...registration.mapperConfig,
      basic: {
        ...defaults.mapperConfig.basic,
        ...registration.mapperConfig?.basic,
      },
      custom: { sendToken: false, ...registration.mapperConfig?.custom },
    },
  };
}

export function toClientPayload(client: OAuth2Client): OAuth2Client {
  const result = JSON.parse(JSON.stringify(client)) as OAuth2Client;
  result.title = result.title.trim();
  result.scope = [
    ...new Set(result.scope.map((scope) => scope.trim()).filter(Boolean)),
  ];
  if (result.mapperConfig.type === 'CUSTOM') {
    delete result.mapperConfig.basic;
  } else {
    delete result.mapperConfig.custom;
    if (result.mapperConfig.type === 'GITHUB' && result.mapperConfig.basic) {
      delete result.mapperConfig.basic.emailAttributeKey;
    }
    if (result.mapperConfig.basic?.tenantNameStrategy !== 'CUSTOM') {
      delete result.mapperConfig.basic?.tenantNamePattern;
    }
  }
  return result;
}

export function getDomainClientIds(domain: OAuth2DomainInfo): string[] {
  return (domain.oauth2ClientInfos ?? []).flatMap((client) => {
    const id = typeof client === 'string' ? client : client.id?.id;
    return id ? [id] : [];
  });
}
