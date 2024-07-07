import {todolistsAPI, TodolistType} from '../../api/todolists-api'
import {Dispatch} from 'redux'
import {RequestStatusType, setErrorAC, setErrorType, setLoading, setLoadingType} from "../../app/ app-reducer";

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
        const res = await todolistsAPI.getTodolists()
        dispatch(setTodolistsAC(res.data))
        dispatch(setLoading('succeeded'))
    }
}

export const removeTodolistTC = (todolistId: string) => {
    return async (dispatch: Dispatch<ActionsType>) => {
        dispatch(setLoading('loading'))
        dispatch(changeEntityStatusAC(todolistId, 'loading'))
        try {
            const res = await todolistsAPI.deleteTodolist(todolistId)
            dispatch(removeTodolistAC(todolistId))
            dispatch(setLoading('succeeded'))
        } catch (e: any) {
            dispatch(changeEntityStatusAC(todolistId, 'idle'))
            dispatch(setLoading('failed'))
            dispatch(setErrorAC(e.message))
        }
    }
}
export const addTodolistTC = (title: string) => {
    return async (dispatch: Dispatch<ActionsType>) => {
        dispatch(setLoading('loading'))
        const res = await todolistsAPI.createTodolist(title)
        dispatch(addTodolistAC(res.data.data.item))
        dispatch(setLoading('succeeded'))
    }
}
export const changeTodolistTitleTC = (id: string, title: string) => {
    return async (dispatch: Dispatch<ActionsType>) => {
        dispatch(setLoading('loading'))
        try {
            const res = await todolistsAPI.updateTodolist(id, title)
            dispatch(changeTodolistTitleAC(id, title))
            dispatch(setLoading('succeeded'))
        } finally {

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
