
export type UserProgress = {
  level: number,
  attempts: number,
  rank: number,
}
type GameRecords = {
  [user: string]: UserRecords | undefined,
}
type UserRecords = {
  [challenge: string]: number | undefined,
}

function storageField<T>(name: string, getDefault: (() => T)) {
  return {
    get: () => {
      let json = (localStorage as any)[name];
      if (json === undefined)
        return getDefault()
      try { return JSON.parse(json) as T }
      catch { return getDefault() }
    },
    put: (value: T) => {
      let json = JSON.stringify(value);
      (localStorage as any)[name] = json;
    },
    clear: () => {
      delete (localStorage as any)[name];
    }
  }
}

export const Storage = {
  progress: storageField<UserProgress>("progress", () => ({
    level: 0,
    attempts: 0,
    rank: 0,
  })),
  recordTimes: storageField<GameRecords>("recordTimes", () => ({
  })),
  user: storageField<string>("user", () => "guest"),
}