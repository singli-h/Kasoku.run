import React, { createContext, useEffect, useReducer } from "react"

const initialState = {
  loading: false,
  result: null,
  file: null,
}

const NutritionAnalyzerReducer = (state, action) => {
  switch (action.type) {
    case "setLoading": {
      return { ...state, loading: action.payload }
    }
    case "setResult": {
      return { ...state, result: action.payload }
    }
    case "setFile": {
      return { ...state, file: action.payload }
    }
    default:
      return state
  }
}

export const NutritionAnalyzerContext = createContext(null)

export const NutritionAnalyzerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(NutritionAnalyzerReducer, initialState)
  const temp = { state, dispatch }

  useEffect(() => {
    console.log("NutritionAnalyzerProvider useEffect")
  }, [state.file])
  return (
    <NutritionAnalyzerContext.Provider value={temp}>
      {children}
    </NutritionAnalyzerContext.Provider>
  )
}
