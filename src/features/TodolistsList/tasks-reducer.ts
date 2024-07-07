import {
    AddTodolistActionType,
    changeEntityStatusAC,
    RemoveTodolistActionType,
    SetTodolistsActionType
} from './todolists-reducer'
import {TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType} from '../../api/todolists-api'
import {Dispatch} from 'redux'
import {AppRootStateType} from '../../app/store'
import {RequestStatusType, setErrorAC, setErrorType, setLoading, setLoadingType} from "../../app/ app-reducer";
import {handleServerAppError, handleServerNetworkError} from "../../utils/error-utils";
import axios from "axios";

const initialState: TasksStateType = {}

export const tasksReducer = (state: TasksStateType = initialState, action: ActionsType): TasksStateType => {
    switch (action.type) {
        case 'REMOVE-TASK':
            return {...state, [action.todolistId]: state[action.todolistId].filter(t => t.id !== action.taskId)}
        case 'ADD-TASK':
            return {...state, [action.task.todoListId]: [action.task, ...state[action.task.todoListId]]}
        case 'UPDATE-TASK':
            return {
                ...state,
                [action.todolistId]: state[action.todolistId]
                    .map(t => t.id === action.taskId ? {...t, ...action.model} : t)
            }
        case 'ADD-TODOLIST':
            return {...state, [action.todolist.id]: []}
        case 'REMOVE-TODOLIST':
            const copyState = {...state}
            delete copyState[action.id]
            return copyState
        case 'SET-TODOLISTS': {
            const copyState = {...state}
            action.todolists.forEach(tl => {
                copyState[tl.id] = []
            })
            return copyState
        }
        case 'SET-TASKS':
            return {
                ...state,
                [action.todolistId]: action.tasks.map((task) => ({
                    ...task,
                    entityStatus: 'idle'
                }))
            };
        case "CHANGE-ENTITY-STATUS-TASK":
            return {
                ...state,
                [action.todoid]: state[action.todoid]
                    .map(t => t.id === action.taskId ? {...t, entityStatus: action.entityStatus} : t)
            }

        default:
            return state
    }
}

// actions
export const removeTaskAC = (taskId: string, todolistId: string) =>
    ({type: 'REMOVE-TASK', taskId, todolistId} as const)
export const addTaskAC = (task: TaskType) =>
    ({type: 'ADD-TASK', task} as const)
export const updateTaskAC = (taskId: string, model: UpdateDomainTaskModelType, todolistId: string) =>
    ({type: 'UPDATE-TASK', model, todolistId, taskId} as const)
export const setTasksAC = (tasks: Array<TaskType>, todolistId: string) =>
    ({type: 'SET-TASKS', tasks, todolistId} as const)
export const changeEntityStatusTaskAC = (todoid: string, taskId: string, entityStatus: RequestStatusType) => ({
    type: 'CHANGE-ENTITY-STATUS-TASK',
    todoid,
    taskId,
    entityStatus
} as const)

// thunks
export enum STATUS_CODE {
    SUCCESS = 0,
    ERROR = 1,
    RECAPTCHA = 10,
}

export const fetchTasksTC = (todolistId: string) => async (dispatch: Dispatch<ActionsType>) => {
    dispatch(setLoading('loading'))
    try {
        const res = await todolistsAPI.getTasks(todolistId)
        console.log('TASK')
        console.log(res)
        const tasks = res.data.items
        const action = setTasksAC(tasks, todolistId)
        dispatch(action)
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

export const removeTaskTC = (taskId: string, todolistId: string) => async (dispatch: Dispatch<ActionsType>) => {
    dispatch(changeEntityStatusTaskAC(todolistId, taskId, 'loading'))
    try {
        const res = await todolistsAPI.deleteTask(todolistId, taskId)
        if (res.data.resultCode === STATUS_CODE.SUCCESS) {
            const action = removeTaskAC(taskId, todolistId)
            dispatch(action)
            dispatch(setLoading('succeeded'))
        } else {
            handleServerAppError(dispatch, res.data)
        }
    } catch (error) {
        if (axios.isAxiosError<ErrorType>(error)) {
            handleServerNetworkError(dispatch, error)
        } else {
            const err = error as { message: string }
            handleServerNetworkError(dispatch, err)
        }
    }
    dispatch(changeEntityStatusTaskAC(todolistId, taskId, 'idle'))

}

export const addTaskTC = (title: string, todolistId: string) => async (dispatch: Dispatch<ActionsType>) => {
    dispatch(setLoading('loading'))
    const res = await todolistsAPI.createTask(todolistId, title)
    try {
        if (res.data.resultCode === STATUS_CODE.SUCCESS) {
            const task = res.data.data.item
            const action = addTaskAC(task)
            dispatch(action)
            dispatch(setLoading('succeeded'))
        } else {
            handleServerAppError(dispatch, res.data)
        }
    } catch (error) {
        if (axios.isAxiosError<ErrorType>(error)) {
            handleServerNetworkError(dispatch, error)
        } else {
            const err = error as { message: string }
            handleServerNetworkError(dispatch, err)
        }
    }
}

export const updateTaskTC = (taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string) =>
    async (dispatch: Dispatch<ActionsType>, getState: () => AppRootStateType) => {
        const state = getState()
        const task = state.tasks[todolistId].find(t => t.id === taskId)
        if (!task) {
            //throw new Error("task not found in the state");
            console.warn('task not found in the state')
            return
        }

        const apiModel: UpdateTaskModelType = {
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
            title: task.title,
            status: task.status,
            ...domainModel
        }
        dispatch(setLoading('loading'))
        try {
            const response = await todolistsAPI.updateTask(todolistId, taskId, apiModel)
            if (response.data.resultCode === 0) {
                const action = updateTaskAC(taskId, domainModel, todolistId)
                dispatch(action)
                dispatch(setLoading('succeeded'))
            } else {
                handleServerAppError(dispatch, response.data)
            }

        } catch (error) {
            if (axios.isAxiosError<ErrorType>(error)) {
                handleServerNetworkError(dispatch, error)
            } else {
                const err = error as { message: string }
                handleServerNetworkError(dispatch, err)
            }
        }
    }


// types
export type UpdateDomainTaskModelType = {
    title?: string
    description?: string
    status?: TaskStatuses
    priority?: TaskPriorities
    startDate?: string
    deadline?: string
}
export type TasksStateType = {
    [key: string]: Array<TaskType>
}
type ActionsType =
    | ReturnType<typeof removeTaskAC>
    | ReturnType<typeof addTaskAC>
    | ReturnType<typeof updateTaskAC>
    | ReturnType<typeof changeEntityStatusTaskAC>
    | AddTodolistActionType
    | RemoveTodolistActionType
    | SetTodolistsActionType
    | ReturnType<typeof setTasksAC>
    | setLoadingType
    | setErrorType

export type ErrorType = {
    message: string,
    field: string,
    code: number
}