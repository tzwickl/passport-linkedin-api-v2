import OAuth2Strategy from 'passport-oauth2';
import logger from './logger';
import * as request from 'request';
import { IUser } from "./IUser";
import { IncomingMessage } from "http";

const LOGGER = logger.getLogger('auth');

const LI_OAUTH = 'https://www.linkedin.com/oauth/v2';
const AUTH = LI_OAUTH + '/authorization';
const TOKEN = LI_OAUTH + '/accessToken';

const LI_V2 = 'https://api.linkedin.com/v2';
const ME = LI_V2 + '/me';
const EMAIL = LI_V2 + '/emailAddress?q=members&projection=(elements*(handle~))';

export class LinkedinAuth extends OAuth2Strategy {
  public constructor(options: any, verify: OAuth2Strategy.VerifyFunction) {
    const opts = Object.assign(options, {
      authorizationURL: AUTH,
      tokenURL: TOKEN,
      customHeaders: { 'x-li-format': 'json' },
    });
    super(opts, verify);
  }

  public userProfile(accessToken: string, done: (err?: Error | null, profile?: any) => void): void {
    if (accessToken == null) {
      return done(new OAuth2Strategy.InternalOAuthError('failed to fetch access token', null));
    }
    this._oauth2.setAccessTokenName('oauth2_access_token');
    this._oauth2.get(ME, accessToken, (err: {statusCode: number, data?: any}, body?: string | Buffer, res?: IncomingMessage) => {
      if (err || body == null) {
        return done(new OAuth2Strategy.InternalOAuthError('failed to fetch user profile', err));
      }
      try {
        const json = JSON.parse(body.toString());
        LinkedinAuth.handleLiResponse(json);
        done(null, json);
      } catch (e) {
        done(e);
      }
    });
  }

  public static getLiteProfile(accessToken: string,
                               done: (err?: (Error | null), profile?: any) => void) {
    request.get(
      ME + '?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))',
      { headers: LinkedinAuth.getHeader(accessToken) },
      (error: any, response: request.Response, body: any) => {
        if (error) {
          return done(new OAuth2Strategy.InternalOAuthError('failed to fetch user profile', error));
        }

        try {
          const json = JSON.parse(body);
          LinkedinAuth.handleLiResponse(json);
          LinkedinAuth.getUserEmail(accessToken, (err, email) => {
            if (err) {
              return done(
                new OAuth2Strategy.InternalOAuthError('failed to fetch user email', error));
            }
            json.email = email;
            json.accessToken = accessToken;
            done(null, LinkedinAuth.parseLinkedInProfile(json));
          });
        } catch (e) {
          done(e);
        }
      });
  }

  /**
   * Handles LI Responses
   * @param body The LI Response body.
   */
  private static handleLiResponse(body: any) {
    if (body.status >= 400) {
      throw body.message;
    }
  }

  /**
   * Returns the email of the user.
   * @param accessToken The access token to request the email.
   * @param done Callback function.
   */
  public static getUserEmail(accessToken: string,
                             done: (err?: Error | null, email?: any) => void) {
    request.get(EMAIL, { headers: LinkedinAuth.getHeader(accessToken) },
      (error: any, response: request.Response, body: any) => {
        if (error) {
          return done(new OAuth2Strategy.InternalOAuthError('failed to fetch user email', error));
        }

        try {
          const json = JSON.parse(body);
          LinkedinAuth.handleLiResponse(json);
          done(null, json);
        } catch (e) {
          done(e);
        }
      });
  }

  /**
   * Parses and extracts all available information from the LI profile.
   * @param linkedInProfile The LI profile.
   */
  private static parseLinkedInProfile(linkedInProfile: any): IUser {
    let email = '';
    if (linkedInProfile.email.elements && linkedInProfile.email.elements.length > 0 &&
      linkedInProfile.email.elements[0]['handle~'] &&
      linkedInProfile.email.elements[0]['handle~'].emailAddress) {
      email = linkedInProfile.email.elements[0]['handle~'].emailAddress.toLocaleLowerCase();
    }

    let lastName = '';
    if (linkedInProfile.lastName) {
      lastName = LinkedinAuth.getMultiLocaleString(linkedInProfile.lastName)
    }

    let firstName = '';
    if (linkedInProfile.firstName) {
      firstName = LinkedinAuth.getMultiLocaleString(linkedInProfile.firstName)
    }

    let profilePicture = '';

    if (linkedInProfile.profilePicture && linkedInProfile.profilePicture['displayImage~'] &&
      linkedInProfile.profilePicture['displayImage~'].elements &&
      linkedInProfile.profilePicture['displayImage~'].elements.length > 0) {
      const image = linkedInProfile.profilePicture['displayImage~'].elements[0];

      if (image.identifiers && image.identifiers.length > 0) {
        profilePicture = image.identifiers[0].identifier;
      }
    }

    // Returning user with details from linkedIn profile
    return {
      email,
      lastName,
      firstName,
      profilePicture,
      linkedIn: {
        accessToken: linkedInProfile.accessToken,
        id: linkedInProfile.id,
      },
    };
  }

  private static getMultiLocaleString(multiLocaleSring: any): string {
    if (multiLocaleSring.localized == null || multiLocaleSring.preferredLocale == null) {
      return '';
    }

    let locale = multiLocaleSring.preferredLocale.language;
    if (multiLocaleSring.preferredLocale.country) {
      locale += '_' + multiLocaleSring.preferredLocale.country;
    }

    return multiLocaleSring.localized[locale];

  }

  private static getHeader(accessToken: string): any {
    const headers: any = [];
    headers['Authorization'] = 'Bearer ' + accessToken;
    return headers;
  }

  public authorizationParams(options: any): object {
    const params: any = {};

    // LinkedIn requires state parameter. It will return an error if not set.
    if (options.state) {
      params['state'] = options.state;
    }
    return params;
  }

}
