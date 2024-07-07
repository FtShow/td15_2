import {todolistsAPI, TodolistType} from '../../api/todolists-api'
import {Dispatch} from 'redux'
import {RequestStatusType, setErrorAC, setErrorType, setLoading, setLoadingType} from "../../app/ app-reducer";
import {ErrorType, STATUS_CODE} from "./tasks-reducer";
import {handleServerAppError, handleServerNetworkError} from "../../utils/error-utils";
import axios from "axios";

const initialState: Array<TodolistDomainType> = []

export const todolistsReducer = (state: Array<TodolistDomainType> = initialState, action: ActionsType): Array<TodolistDomainType> => {
    switch (action.type) {
        case 'REMOVE-TODOLIST':
            return state.filter(tl => tl.id !== action.id)
        case 'ADD-TODOLIST':
            return [{...action.todolist, filter: 'all', entityStatus: 'idle'}, ...state]
        case 'CHANGE-TODOLIST-TITLE':
            return state.map(tl => tl.id === action.id ? {...tl, title: action.title} : tl)
        case 'CHANGE-TODOLIST-FILTER':
            return state.map(tl => tl.id === action.id ? {...tl, filter: action.filter} : tl)
        case 'SET-TODOLISTS':
            return action.todolists.map(tl => ({...tl, filter: 'all', entityStatus: 'idle'}))

        case "CHANGE-ENTITY-STATUS":
            return state.map(tl => {
                if (action.todoid === tl.id) {
                    return ({...tl, entityStatus: action.entityStatus})
                } else {
                    return tl
                }
            })

        default:
            return state
    }
}

// actions
export const removeTodolistAC = (id: string) => ({type: 'REMOVE-TODOLIST', id} as const)
export const addTodolistAC = (todolist: TodolistType) => ({type: 'ADD-TODOLIST', todolist} as const)
export const changeTodolistTitleAC = (id: string, title: string) => ({
    type: 'CHANGE-TODOLIST-TITLE',
    id,
    title
} as const)
export const changeTodolistFilterAC = (id: string, filter: FilterValuesType) => ({
    type: 'CHANGE-TODOLIST-FILTER',
    id,
    filter
} as const)
export const setTodolistsAC = (todolists: Array<TodolistType>) => ({type: 'SET-TODOLISTS', todolists} as const)
export const changeEntityStatusAC = (todoid: string, entityStatus: RequestStatusType) => ({
    type: 'CHANGE-ENTITY-STATUS',
    todoid,
    entityStatus
} as const)

// thunks
export const fetchTodolistsTC = () => {
    return async (dispatch: Dispatch<ActionsType>) => {
        try {
            const res = await todolistsAPI.getTodolists()
            console.log(res)
            dispatch(setTodolistsAC(res.data))
            dispatch(setLoading('succeeded'))
        }
        finally {

        }
    }
}

export const removeTodolistTC = (todolistId: string) => {
    return async (dispatch: Dispatch<ActionsType>) => {
        dispatch(setLoading('loading'))
        dispatch(changeEntityStatusAC(todolistId, 'loading'))
        try {
            const res = await todolistsAPI.deleteTodolist(todolistId)
            if (res.data.resultCode === STATUS_CODE.SUCCESS) {
            dispatch(removeTodolistAC(todolistId))
            dispatch(setLoading('succeeded'))}
            else {
                handleServerAppError(dispatch, res.data)
            }
        }

        catch (error) {
            if (axios.isAxiosError<ErrorType>(error)) {
                handleServerNetworkError(dispatch, error)
            } else {
                const err = error as { message: string }
                handleServerNetworkError(dispatch, err)
            }
            dispatch(changeEntityStatusAC(todolistId, 'idle'))
        }
    }
}
export const addTodolistTC = (title: string) => {
    return async (dispatch: Dispatch<ActionsType>) => {
        dispatch(setLoading('loading'))
        try {
            const res = await todolistsAPI.createTodolist(title)
            if (res.data.resultCode === STATUS_CODE.SUCCESS) {
            dispatch(addTodolistAC(res.data.data.item))
            dispatch(setLoading('succeeded'))}
        else {
                handleServerAppError(dispatch, res.data)
            }
        }
        catch (error) {
            if (axios.isAxiosError<ErrorType>(error)) {
                handleServerNetworkError(dispatch, error)
            } else {
                const err = error as { message: string }
                handleServerNetworkError(dispatch, err)
            }
        }

    }
}
export const changeTodolistTitleTC = (id: string, title: string) => {
    return async (dispatch: Dispatch<ActionsType>) => {
        dispatch(setLoading('loading'))
        try {
            const res = await todolistsAPI.updateTodolist(id, title)
            dispatch(changeTodolistTitleAC(id, title))
            dispatch(setLoading('succeeded'))
        } catch (error) {
            if (axios.isAxiosError<ErrorType>(error)) {
                handleServerNetworkError(dispatch, error)
            } else {
                const err = error as { message: string }
                handleServerNetworkError(dispatch, err)
            }
        }

    }
}

// types
export type AddTodolistActionType = ReturnType<typeof addTodolistAC>;
export type RemoveTodolistActionType = ReturnType<typeof removeTodolistAC>;
export type SetTodolistsActionType = ReturnType<typeof setTodolistsAC>;
type ActionsType =
    | RemoveTodolistActionType
    | AddTodolistActionType
    | ReturnType<typeof changeTodolistTitleAC>
    | ReturnType<typeof changeTodolistFilterAC>
    | ReturnType<typeof changeEntityStatusAC>
    | SetTodolistsActionType
    | setLoadingType
    | setErrorType
export type FilterValuesType = 'all' | 'active' | 'completed';
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType,
    entityStatus: RequestStatusType,
}
