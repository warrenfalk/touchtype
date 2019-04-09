type ErrorResult = {
  error: Error
}
type SuccessResult<T> = {
  success: T
}
type Result<T> = ErrorResult | SuccessResult<T>
export type ResultCallback<T> = (result: Result<T>) => void
export function isError<T>(result: Result<T>): result is ErrorResult { return (result as any).error !== undefined; }

export function apiPost<TReq,TRes>(path: string, data: TReq, callback: ResultCallback<TRes>) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", path, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.send(JSON.stringify(data));
    xhr.onloadend = function () {
      if (xhr.status >= 400) {
        callback({error: Error(`${xhr.status} - ${xhr.statusText}`)})
        return
      }
      const response = JSON.parse(xhr.responseText) as TRes;
      callback({success: response});
    };
  }
  
  