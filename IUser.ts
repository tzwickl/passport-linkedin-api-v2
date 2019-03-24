export interface IUser {
  linkedIn?: {
    accessToken: string;
    id: string;
  },
  email: string,
  lastName: string,
  firstName: string,
  profilePicture: string,
  profilePictures: string[],
  _profileRaw: string,
  _profileJson: any,
}
