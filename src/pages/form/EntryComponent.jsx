'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Button from '../../components/common/Button';

export default function PresetManagementPage() {
  const [presetGroups, setPresetGroups] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroupDetails, setNewGroupDetails] = useState({
    week: '',
    day: '',
    date: new Date(),
    name: '',
  });
  const [sections, setSections] = useState({
    warmup: [],
    gym: [],
    circuit: [],
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openSections, setOpenSections] = useState({
    warmup: true,
    gym: true,
    circuit: true,
  });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:54321/functions/v1';

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/exercisesInit`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        setPresetGroups(data.exercisePresetGroups);
        setExercises(data.exercises);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleGroupSelection = async (e) => {
    const groupId = e.target.value;
    const group = presetGroups.find((group) => group.id === parseInt(groupId));
    if (group) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/exercise_presets?exercise_preset_group_id=${group.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch exercises for the group');
        }
        const presetsResponse = await response.json();
        const presets = presetsResponse.exercise_presets;

        const updatedSections = {
          warmup: presets
            .filter((preset) => preset.exercise_id)
            .map((preset) => ({
              ...preset,
              exercise_type_id: exercises.find((exercise) => exercise.id === preset.exercise_id)?.exercise_type_id,
            }))
            .filter((preset) => preset.exercise_type_id === 1),
          gym: presets
            .filter((preset) => preset.exercise_id)
            .map((preset) => ({
              ...preset,
              exercise_type_id: exercises.find((exercise) => exercise.id === preset.exercise_id)?.exercise_type_id,
            }))
            .filter((preset) => preset.exercise_type_id === 2),
          circuit: presets
            .filter((preset) => preset.exercise_id)
            .map((preset) => ({
              ...preset,
              exercise_type_id: exercises.find((exercise) => exercise.id === preset.exercise_id)?.exercise_type_id,
            }))
            .filter((preset) => preset.exercise_type_id === 3),
        };

        setSelectedGroup(group);
        setNewGroupDetails({
          week: group.week,
          day: group.day,
          date: new Date(group.date),
          name: group.name,
        });
        setSections(updatedSections);
      } catch (err) {
        console.error('Error fetching exercises for the selected group:', err);
        setError(err.message);
      }
    }
  };

  const handleNewGroupChange = (field, value) => {
    setNewGroupDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleDragEnd = (result, section) => {
    if (!result.destination) return;

    const updatedSection = Array.from(sections[section]);
    const [moved] = updatedSection.splice(result.source.index, 1);
    updatedSection.splice(result.destination.index, 0, moved);

    setSections((prev) => ({ ...prev, [section]: updatedSection }));
  };

  const handleSaveOrCreate = async (cloneCurrent = false) => {
    try {
      const isClone = cloneCurrent && selectedGroup;
  
      // Define API endpoint and method for group
      let endpoint = `${API_BASE_URL}/api/exercise_preset_groups`;
      let method = 'POST'; // Default: create new group
  
      // If updating an existing group
      if (selectedGroup && !isClone) {
        endpoint = `${API_BASE_URL}/api/exercise_preset_groups/${selectedGroup.id}`;
        method = 'PUT';
      }
  
      // Prepare group payload
      const groupPayload = {
        ...newGroupDetails,
        week: parseInt(newGroupDetails.week, 10),
        day: parseInt(newGroupDetails.day, 10),
        ...(selectedGroup && !isClone ? { id: selectedGroup.id } : {}) // Add 'id' only for update
      };
  
      // Save or create group
      const groupResponse = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupPayload),
      });
  
      if (!groupResponse.ok) {
        throw new Error(isClone ? 'Failed to clone preset group' : 'Failed to save preset group');
      }
  
      const groupData = await groupResponse.json();
      const newExercise_preset_group = groupData.exercise_preset_group[0];
      console.log({groupData:groupData});
      // Prepare exercise payload
      const exercisePayload = ['warmup', 'gym', 'circuit'].flatMap((section) =>
        sections[section].map((exercise, index) => {
          const { exercise_type_id, id, ...rest } = exercise; // Exclude `exercise_type_id` and conditionally `id`
          return {
            ...rest,
            order: index,
            exercise_preset_group_id: newExercise_preset_group.id,
            ...(isClone ? {} : { id }), // Include `id` only if not cloning
          };
        })
      );
  
      console.log({ exercisePayload });
  
      // Separate the payload
      const recordsToUpdate = exercisePayload.filter((record) => record.id);
      const recordsToInsert = exercisePayload.filter((record) => !record.id);
  
      // Handle updates
      if (!isClone && recordsToUpdate.length > 0) {
        const updateResponse = await fetch(`${API_BASE_URL}/api/exercise_presets`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordsToUpdate),
        });
  
        if (!updateResponse.ok) {
          throw new Error('Failed to update exercises');
        }
      }
  
      // Handle inserts
      if (recordsToInsert.length > 0) {
        const insertResponse = await fetch(`${API_BASE_URL}/api/exercise_presets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordsToInsert),
        });
  
        if (!insertResponse.ok) {
          throw new Error('Failed to insert exercises');
        }
      }
  
      alert(isClone ? 'Preset cloned and saved successfully!' : 'Preset saved successfully!');
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredExercises = (typeId) =>
    exercises.filter((exercise) => exercise.exercise_type_id === typeId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-white-800">Manage Presets</h1>
      <div>
          <label className="block text-sm font-medium text-white-700">Preset Group</label>
          <select
            className="w-full p-2 border rounded text-gray-700"
            value={selectedGroup?.id || ''}
            onChange={handleGroupSelection}
          >
            <option value="">Select group</option>
            {presetGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-white-700">Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded text-gray-700"
            value={newGroupDetails.name}
            onChange={(e) => handleNewGroupChange('name', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white-700">Week</label>
          <input
            type="number"
            className="w-full p-2 border rounded text-gray-700"
            value={newGroupDetails.week}
            onChange={(e) => handleNewGroupChange('week', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white-700">Day</label>
          <input
            type="number"
            className="w-full p-2 border rounded text-gray-700"
            value={newGroupDetails.day}
            onChange={(e) => handleNewGroupChange('day', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white-700">Date</label>
          <DatePicker
            selected={newGroupDetails.date}
            onChange={(date) => handleNewGroupChange('date', date)}
            className="w-full p-2 border rounded text-gray-700"
          />
        </div>
      </div>

      {['warmup', 'gym', 'circuit'].map((section) => (
        <div key={section} className="bg-white p-4 rounded-lg shadow-md space-y-4">
          {/* Section Header with toggle functionality */}
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection(section)}
          >
            <h2 className="text-xl font-semibold capitalize text-gray-800">{section}</h2>
            <span className="text-gray-600">{openSections[section] ? '▼' : '▲'}</span>
          </div>

          {/* Section content - only visible if open */}
          {openSections[section] && (
            <div>
              <DragDropContext onDragEnd={(result) => handleDragEnd(result, section)}>
                <Droppable droppableId={section}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2"
                    >
                      {sections[section].map((exercise, index) => (
                        <Draggable
                          key={exercise.id}
                          draggableId={`${exercise.id}`}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="p-4 border rounded bg-white"
                            >
                              {/* Dropdown for selecting exercise */}
                              <div className="mb-2">
                                <select
                                  className="w-full p-2 border rounded text-gray-700"
                                  value={exercise.exercise_id || ''}
                                  onChange={(e) => {
                                    const updatedSections = { ...sections };
                                    updatedSections[section][index].exercise_id = parseInt(e.target.value);
                                    setSections(updatedSections);
                                  }}
                                >
                                  <option value="">Select Exercise</option>
                                  {filteredExercises(section === 'warmup' ? 1 : section === 'gym' ? 2 : 3).map((ex) => (
                                    <option key={ex.id} value={ex.id}>
                                      {ex.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {/* Grid for editable fields, excluding 'sets' for gym exercises */}
                              {/* Grid for editable fields */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 items-center">
                                {[
                                  ...(section !== 'gym' ? ['sets'] : []), // Include Power and Velocity only for gym
                                  'reps',
                                  'weight',
                                  'set_rest_time',
                                  ...(section === 'gym' ? ['power', 'velocity'] : []), // Include Power and Velocity only for gym
                                  
                                ].map((field) => (
                                  <div key={field} className="col-span-1">
                                    <label className="block text-xs text-gray-600 capitalize">
                                      {field.replace(/_/g, ' ')}
                                    </label>
                                    <input
                                      type="number"
                                      className="w-full p-2 border rounded text-gray-700"
                                      value={exercise[field] || ''}
                                      onChange={(e) => {
                                        const updatedSections = { ...sections };
                                        updatedSections[section][index][field] = parseFloat(e.target.value) || '';
                                        setSections(updatedSections);
                                      }}
                                      placeholder={field}
                                    />
                                  </div>
                                ))}
                              </div>

                              {/* Delete button for removing an exercise */}
                              <button
                                onClick={() =>
                                  setSections((prev) => ({
                                    ...prev,
                                    [section]: prev[section].filter((_, i) => i !== index),
                                  }))
                                }
                                className="text-red-500 mt-2"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              {/* Add Exercise Button */}
              <Button
                onClick={() =>
                  setSections((prev) => ({
                    ...prev,
                    [section]: [
                      ...prev[section],
                      { exercise_id: null, reps: null, weight: null, set_rest_time: null, power: null, velocity: null, order: prev[section].length },
                    ],
                  }))
                }
                className="text-blue-500 mt-2"
              >
                Add Exercise
              </Button>
            </div>
          )}
        </div>
      ))}
      
      <div className='flex grid-col-2 item-center justify-between'>
      <Button onClick={() => handleSaveOrCreate(true)}>
        Create New
      </Button>
      {/* Only able to use save when preset selected */}
      {selectedGroup ? (
      <Button onClick={() => handleSaveOrCreate()}>
        Save Preset
      </Button>
      ) : ""}
      </div>
    </div>
  );
}
