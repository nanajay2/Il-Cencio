import { useState, useCallback } from 'react';
import { api } from '../api.js';

export function useHouse() {
  const [house,   setHouse]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const load = useCallback(async (houseId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHouse(houseId);
      setHouse(data);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  async function addUser(houseId, name, email) {
    const user = await api.createUser(houseId, name, email);
    setHouse(h => h ? { ...h, users: [...h.users, { ...user, claimed: false }] } : h);
    return user;
  }

  async function removeUser(houseId, userId) {
    await api.deleteUser(houseId, userId);
    setHouse(h => h ? { ...h, users: h.users.filter(u => u.id !== userId) } : h);
  }

  async function addRoom(houseId, data) {
    const room = await api.createRoom(houseId, data);
    setHouse(h => h ? { ...h, rooms: [...h.rooms, room].sort((a,b) => a.sortOrder - b.sortOrder) } : h);
    return room;
  }

  async function editRoom(houseId, roomId, data) {
    await api.updateRoom(houseId, roomId, data);
    setHouse(h => h ? { ...h, rooms: h.rooms.map(r => r.id === roomId ? { ...r, ...data } : r) } : h);
  }

  async function removeRoom(houseId, roomId) {
    await api.deleteRoom(houseId, roomId);
    setHouse(h => h ? { ...h, rooms: h.rooms.filter(r => r.id !== roomId) } : h);
  }

  async function addRule(houseId, type, config) {
    const rule = await api.createRule(houseId, type, config);
    setHouse(h => h ? { ...h, rules: [...h.rules, rule] } : h);
    return rule;
  }

  async function editRule(houseId, ruleId, type, config) {
    await api.updateRule(houseId, ruleId, type, config);
    setHouse(h => h ? { ...h, rules: h.rules.map(r => r.id === ruleId ? { ...r, type, config } : r) } : h);
  }

  async function removeRule(houseId, ruleId) {
    await api.deleteRule(houseId, ruleId);
    setHouse(h => h ? { ...h, rules: h.rules.filter(r => r.id !== ruleId) } : h);
  }

  async function updateRotation(houseId, rotationType, rotationDays) {
    await api.updateRotation(houseId, rotationType, rotationDays);
    setHouse(h => h ? { ...h, rotationType, rotationDays: rotationType === 'daily' ? rotationDays : null } : h);
  }

  return {
    house, loading, error, load,
    addUser, removeUser,
    addRoom, editRoom, removeRoom,
    addRule, editRule, removeRule,
    updateRotation,
  };
}
