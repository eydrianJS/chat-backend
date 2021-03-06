const config = require('config');
const { server, app } = require('./src/app');
const AuthRoute = require('./routes/auth');
const RoomRoute = require('./src/room');
require('./src/socket');
require('./src/room');

const PORT = process.env.PORT || config.get('port');
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use('/', RoomRoute);
app.use('/', AuthRoute);

//USER 6055d1a966b643b1e4711d50
// app.use(express.static(path.join(__dirname, 'public'))); for test
