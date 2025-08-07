export async function load({ fetch }) {
  const [
    teamsRes,
    agentsRes,
    agentsQB,
    agentsRB,
    agentsWR,
    agentsTE,
    agentsDT,
    agentsDE,
    agentsLB,
    agentsCB,
    agentsS,
    agentsK,
    pin
  ] = await Promise.all([
    fetch('http://localhost:8000/teams'),
    fetch('http://localhost:8000/free-agents'),
    fetch('http://localhost:8000/free-agents-qb'),
    fetch('http://localhost:8000/free-agents-rb'),
    fetch('http://localhost:8000/free-agents-wr'),
    fetch('http://localhost:8000/free-agents-te'),
    fetch('http://localhost:8000/free-agents-dt'),
    fetch('http://localhost:8000/free-agents-de'),
    fetch('http://localhost:8000/free-agents-lb'),
    fetch('http://localhost:8000/free-agents-cb'),
    fetch('http://localhost:8000/free-agents-s'),
    fetch('http://localhost:8000/free-agents-k'),
    fetch('http://localhost:8000/playerinfo')
  ]);

  if (
    !teamsRes.ok ||
    !agentsRes.ok ||
    !agentsQB.ok ||
    !agentsRB.ok ||
    !agentsWR.ok ||
    !agentsTE.ok ||
    !agentsDT.ok ||
    !agentsDE.ok ||
    !agentsLB.ok ||
    !agentsCB.ok ||
    !agentsS.ok ||
    !agentsK.ok ||
    !pin.ok
  ) {
    console.error('Failed to load one or more data sources');
    return {
      teams: [],
      freeAgents: [],
      freeAgentsByPosition: {},
      aplayer: {}
    };
  }

  const teams = await teamsRes.json();
  const freeAgents = await agentsRes.json();
  const aplater = await pin.json();
  // console.log(freeAgents[1]);

  const freeAgentsByPosition = {
    QB: await agentsQB.json(),
    RB: await agentsRB.json(),
    WR: await agentsWR.json(),
    TE: await agentsTE.json(),
    DT: await agentsDT.json(),
    DE: await agentsDE.json(),
    LB: await agentsLB.json(),
    CB: await agentsCB.json(),
    S: await agentsS.json(),
    K: await agentsK.json()
  };
console.log(freeAgentsByPosition.WR[0]);
  return {
    teams,
    freeAgents,
    freeAgentsByPosition
  };
}