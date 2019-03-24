A simple [Passport](http://passportjs.org/) strategy for LinkedIn OAuth2 API Version 2.

## Install

  npm install passport-linkedin-api-v2

## Usage
### Typescript

~~~typescript
import * as passport from 'passport';
import { IUser, LinkedinAuth } from 'passport-linkedin-api-v2';

class LinkedInAuthController {
  // Register the strategy
  public initialize() {
    passport.use('linkedin', this.getStrategy());
    return passport.initialize();
  }

  // Return strategy for LinkedIn
  private getStrategy = (): passport.Strategy => {
    const params = {
      clientID: 'CLIENT_ID',
      clientSecret: 'CLIENT_SECRET',
      callbackURL: 'http://127.0.0.1:3000/auth/linkedin',
      scope: ['r_emailaddress', 'r_liteprofile'],
    };

    return new LinkedinAuth(params,
      (accessToken: string, refreshToken: string, profile: any, done: any) => {
        // This function is called once a user successfully authenticated
        profile.accessToken = accessToken;
        done(profile);
      });
  };

  // Authenticate with LinkedIn and handle callback
  private authenticate = (strategy: string, state: string, callback: any) => passport.authenticate(
    strategy,
    {
      state,
      session: false,
      failWithError: true,
      passReqToCallback: true,
    },
    callback);

  // Route /auth/linkedin
  public authenticateUser = (req: any, res: any) => {
    this.authenticate('linkedin', 'custom_state', async (profile: any) => {
      // This function is called once a user successfully authenticated
      if (!profile || profile.id == null || profile.accessToken == null) {
        throw 'Authentication failed';
      }
      const user = await this.getUser(profile.accessToken);
    })(req, res);
  };

  // Return LiteProfile of user
  private getUser = (accessToken: string): Promise<IUser> => {
    return new Promise<IUser>((resolve, reject) => {
      LinkedinAuth.getLiteProfile(accessToken, (err, profile) => {
        if (err) {
          return reject(err);
        }
        resolve(profile);
      });
    });
  };
}

export const linkedInAuthController = new LinkedInAuthController();
export const authenticateUser = linkedInAuthController.authenticateUser;
~~~

### Javascript
Register the strategy
~~~javascript
var passport = require('passport');
var LinkedinAuth = require('passport-linkedin-api-v2').LinkedinAuth;
 
passport.use('linkedin', new LinkedinAuth({
  clientID: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  callbackURL: "http://127.0.0.1:3000/auth/linkedin/callback",
  scope: ['r_emailaddress', 'r_liteprofile', 'w_member_social'],
}, function (accessToken, refreshToken, profile, done) {
  // asynchronous verification, for effect...
  process.nextTick(function () {
    // To keep the example simple, the user's LinkedIn profile is returned to
    // represent the logged-in user. In a typical application, you would want
    // to associate the LinkedIn account with a user record in your database,
    // and return that user instead.
    
    // To get the liteProfile and the email
    linkedinStrat.getUserEmail(accessToken, (err, email) => {
      console.log(email)
    })
    linkedinStrat.getLiteProfile(accessToken, (err, liteprofile) => {
      console.log(liteprofile)
    })
    
    return done(null, profile);
  });
}));
~~~
and then authenticate as:
~~~javascript
app.use(passport.initialize());
app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }),
  function (req, res) {
    // The request will be redirected to LinkedIn for authentication, so this
    // function will not be called.
  });
~~~
the login callback:
~~~javascript
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {
  successRedirect: '/',
  failureRedirect: '/login',
}));
~~~

See [this](https://docs.microsoft.com/en-us/linkedin/consumer/) for details on LinkedIn API v2.

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section.

## Author

[Thomas Zwickl](https://github.com/tzwickl)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
