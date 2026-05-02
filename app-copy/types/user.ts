export interface RegisterPostDTO{
  username: string;
  email: string;
  password: string;
  userBio: string | null;
  isGuest: boolean;
}

export interface UserAuthDTO{
  userId: number;
  token: string;
}

export interface LoginPostDTO{
  username: string;
  password: string;
}

export interface UserScoreboard{
  totalPoints: number,
  gamesPlayed: number,
  gamesWon: number,
  guessingPrecision: number
}

export interface MyUserDTO{
  userScoreboard: UserScoreboard;
  username: string,
  email: string,
  userBio: string,
  creationDate: Date,
  friends: UserDTO[]
}

export interface UserDTO{
  userScoreboard: UserScoreboard;
  username: string,
  userBio: string,
  creationDate: Date,
  friends: UserDTO[]
}

export interface UserResult {
  userId: number;
  totalPoints: number;
  roundPoints: number;
  xCoordinate: number;
  yCoordinate: number;
  distance: number;
}