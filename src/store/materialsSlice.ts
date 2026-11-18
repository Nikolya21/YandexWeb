import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Material, CreateMaterialDto } from '../types/campus';
import { materialsApi } from '../api/materialsApi';

interface MaterialsState {
  items: Material[];
  starredIds: string[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: MaterialsState = {
  items: [],
  starredIds: [],
  status: 'idle',
  error: null,
};

export const fetchMaterials = createAsyncThunk(
  'materials/fetchAll',
  async (simulateError: boolean = false, { rejectWithValue }) => {
    try {
      return await materialsApi.getAll(simulateError);
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Ошибка загрузки');
    }
  }
);

export const createMaterial = createAsyncThunk(
  'materials/create',
  async (dto: CreateMaterialDto) => {
    return await materialsApi.create(dto);
  }
);

export const deleteMaterial = createAsyncThunk(
  'materials/delete',
  async (id: string) => {
    return await materialsApi.delete(id);
  }
);

export const toggleStar = createAsyncThunk(
  'materials/toggleStar',
  async (materialId: string) => {
    return await materialsApi.toggleStar(materialId);
  }
);

export const submitTypo = createAsyncThunk(
  'materials/submitTypo',
  async (payload: { materialId: string; text: string; authorName: string }) => {
    return await materialsApi.addTypo(payload.materialId, payload.text, payload.authorName);
  }
);

export const submitReport = createAsyncThunk(
  'materials/submitReport',
  async (payload: { materialId: string; text: string; authorName: string }) => {
    return await materialsApi.addReport(payload.materialId, payload.text, payload.authorName);
  }
);

const materialsSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaterials.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMaterials.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.materials;
        state.starredIds = action.payload.starredIds;
      })
      .addCase(fetchMaterials.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Не удалось загрузить файлы';
      })
      .addCase(createMaterial.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(deleteMaterial.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(toggleStar.fulfilled, (state, action) => {
        const idx = state.items.findIndex((item) => item.id === action.payload.material.id);
        if (idx !== -1) state.items[idx] = action.payload.material;
        state.starredIds = action.payload.starredIds;
      })
      .addCase(submitTypo.fulfilled, (state, action) => {
        const idx = state.items.findIndex((item) => item.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(submitReport.fulfilled, (state, action) => {
        const idx = state.items.findIndex((item) => item.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      });
  },
});

export default materialsSlice.reducer;
