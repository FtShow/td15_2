import {Dispatch} from "redux";
import {setErrorAC, setErrorType, setLoading, setLoadingType} from "../app/ app-reducer";
import {ResponseType} from "../api/todolists-api";
import axios from "axios";
type ErrorUtilsDispatchType = Dispatch<setErrorType | setLoadingType>

export const handleServerNetworkError  = (dispatch: ErrorUtilsDispatchType, error: {message: string}) =>{
    dispatch(setLoading('failed'))
    dispatch(setErrorAC(error.message))

}

export const handleServerAppError  = <T>(dispatch: ErrorUtilsDispatchType, data: ResponseType<T>) =>{
    if (data.messages.length) {
        dispatch(setErrorAC(data.messages[0]))
    } else {
        dispatch(setErrorAC('SOME ERROR'))
    }
    dispatch(setLoading('failed'))
}
