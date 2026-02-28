jest.mock('../services/LiveGame.service', () => ({
  getUserLiveGames: jest.fn(),
  deleteLiveGame: jest.fn(),
}));

const liveGameService = require('../services/LiveGame.service');
const {
  listLiveGames,
  deleteLiveGames,
} = require('../controllers/LiveGame.controller');

describe('LiveGame Controllers', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    req = {
      user: { _id: 'user1' },
      query: {},
      params: {},
    };
  });

  it('listLiveGames should return data successfully', async () => {
    const mockResult = { data: [], total: 0, pages: 0 };
    liveGameService.getUserLiveGames.mockResolvedValue(mockResult);

    await listLiveGames(req, res);

    expect(liveGameService.getUserLiveGames).toHaveBeenCalledWith(
      'user1',
      1,
      10,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  it('deleteLiveGames should delete data successfully', async () => {
    req.params.playerId = 'player1';
    const mockDeleted = { deleted: true };
    liveGameService.deleteLiveGame.mockResolvedValue(mockDeleted);

    await deleteLiveGames(req, res);

    expect(liveGameService.deleteLiveGame).toHaveBeenCalledWith(
      'user1',
      'player1',
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockDeleted);
  });

  it('listLiveGames should handle errors', async () => {
    const error = new Error('Test error');
    liveGameService.getUserLiveGames.mockRejectedValue(error);

    await listLiveGames(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Test error' });
  });

  it('deleteLiveGames should handle errors', async () => {
    req.params.playerId = 'player1';
    const error = new Error('Test delete error');
    liveGameService.deleteLiveGame.mockRejectedValue(error);

    await deleteLiveGames(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Test delete error' });
  });
});
