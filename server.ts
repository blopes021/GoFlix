import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // TMDB Proxy Routes
  app.get('/api/movies/trending', async (req, res) => {
    try {
      if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
      const response = await fetch(`${TMDB_BASE_URL}/trending/movie/day?api_key=${TMDB_API_KEY}&language=pt-BR`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch trending movies' });
    }
  });

  app.get('/api/movies/popular', async (req, res) => {
    const { page = 1, sort_by = 'popularity.desc' } = req.query;
    try {
      if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
      const response = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&page=${page}&sort_by=${sort_by}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch popular movies' });
    }
  });

  app.get('/api/movies/popular-tv', async (req, res) => {
    const { page = 1, sort_by = 'popularity.desc' } = req.query;
    try {
      if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
      const response = await fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&page=${page}&sort_by=${sort_by}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch popular TV shows' });
    }
  });

  app.get('/api/movies/search', async (req, res) => {
    const { query } = req.query;
    try {
      if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
      const response = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${query}&language=pt-BR`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to search movies' });
    }
  });

  app.get('/api/movies/:id', async (req, res) => {
    const { id } = req.params;
    const { type } = req.query;
    const mediaType = type === 'tv' ? 'tv' : 'movie';
    try {
      if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
      
      const appendToResponse = mediaType === 'tv' ? '&append_to_response=external_ids' : '';
      const response = await fetch(`${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR${appendToResponse}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch movie details' });
    }
  });

  app.get('/api/movies/:id/credits', async (req, res) => {
    const { id } = req.params;
    const { type } = req.query;
    const mediaType = type === 'tv' ? 'tv' : 'movie';
    try {
      if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
      const response = await fetch(`${TMDB_BASE_URL}/${mediaType}/${id}/credits?api_key=${TMDB_API_KEY}&language=pt-BR`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch movie credits' });
    }
  });

  app.get('/api/movies/:id/videos', async (req, res) => {
    const { id } = req.params;
    const { type } = req.query;
    const mediaType = type === 'tv' ? 'tv' : 'movie';
    try {
      if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
      const response = await fetch(`${TMDB_BASE_URL}/${mediaType}/${id}/videos?api_key=${TMDB_API_KEY}&language=pt-BR`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch movie videos' });
    }
  });

  app.get('/api/genres/:type', async (req, res) => {
    const { type } = req.params;
    const mediaType = type === 'tv' ? 'tv' : 'movie';
    try {
      if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
      const response = await fetch(`${TMDB_BASE_URL}/genre/${mediaType}/list?api_key=${TMDB_API_KEY}&language=pt-BR`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch genres' });
    }
  });

  app.get('/api/discover/:type', async (req, res) => {
    const { type } = req.params;
    const { genreId, page = 1, sort_by = 'popularity.desc', primary_release_year, first_air_date_year } = req.query;
    const mediaType = type === 'tv' ? 'tv' : 'movie';
    try {
      if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
      
      let url = `${TMDB_BASE_URL}/discover/${mediaType}?api_key=${TMDB_API_KEY}&language=pt-BR&sort_by=${sort_by}&page=${page}`;
      if (genreId) url += `&with_genres=${genreId}`;
      if (primary_release_year) url += `&primary_release_year=${primary_release_year}`;
      if (first_air_date_year) url += `&first_air_date_year=${first_air_date_year}`;
      
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to discover content' });
    }
  });

  app.get('/api/movies/:id/similar', async (req, res) => {
    const { id } = req.params;
    const { type } = req.query;
    const mediaType = type === 'tv' ? 'tv' : 'movie';
    try {
      if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
      const response = await fetch(`${TMDB_BASE_URL}/${mediaType}/${id}/similar?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch similar content' });
    }
  });

  app.get('/api/tv/:id/season/:season', async (req, res) => {
    const { id, season } = req.params;
    try {
      if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
      const response = await fetch(`${TMDB_BASE_URL}/tv/${id}/season/${season}?api_key=${TMDB_API_KEY}&language=pt-BR`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch TV season details' });
    }
  });

  app.get('/api/person/:id', async (req, res) => {
    const { id } = req.params;
    try {
      if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
      const [detailsRes, creditsRes] = await Promise.all([
        fetch(`${TMDB_BASE_URL}/person/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetch(`${TMDB_BASE_URL}/person/${id}/combined_credits?api_key=${TMDB_API_KEY}&language=pt-BR`)
      ]);
      const details = await detailsRes.json();
      const credits = await creditsRes.json();
      res.json({ ...details, credits });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch person details' });
    }
  });

  app.get('/api/tv/jogos', async (req, res) => {
    try {
      const response = await fetch('https://embedtv.cv/api/jogos');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch games' });
    }
  });

  app.get('/api/tv/channels', async (req, res) => {
    try {
      const response = await fetch('https://embedtv.cv/api/channels');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch channels' });
    }
  });

  app.get('/api/tv/epgs', async (req, res) => {
    try {
      const response = await fetch('https://embedtv.cv/api/epgs');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch EPGs' });
    }
  });

  app.post('/api/reports/notify', async (req, res) => {
    const { movieId, title, mediaType, userEmail } = req.body;
    
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const adminEmail = process.env.ADMIN_EMAIL || 'fabricio.lopes.a@gmail.com';

    if (!smtpUser || !smtpPass) {
      console.warn('SMTP credentials not configured. Skipping email notification.');
      return res.status(200).json({ status: 'skipped', message: 'SMTP not configured' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"GoFlix Reports" <${smtpUser}>`,
      to: adminEmail,
      subject: `🚨 Conteúdo Indisponível: ${title}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ff4500;">Alerta de Conteúdo Indisponível</h2>
          <p>Um usuário relatou que o seguinte conteúdo não está carregando:</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Título:</strong> ${title}</p>
          <p><strong>Tipo:</strong> ${mediaType === 'tv' ? 'Série' : 'Filme'}</p>
          <p><strong>ID TMDB:</strong> ${movieId}</p>
          <p><strong>Relatado por:</strong> ${userEmail || 'Usuário Anônimo'}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Este é um e-mail automático do sistema GoFlix.Space.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ status: 'ok', message: 'Email sent successfully' });
    } catch (error) {
      console.error('Failed to send email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
